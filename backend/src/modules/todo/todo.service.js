import pool from '../../config/database.js';
import { NotFoundError, ForbiddenError, UnprocessableError } from '../../shared/errors/index.js';
import { getKSTTodayString, getKSTWeekRange } from '../../shared/utils/dateUtils.js';
import { logAudit } from '../audit/audit.service.js';

// ─── 상태 전이 매트릭스 ────────────────────────────────────────────────────────
export const ALLOWED_TRANSITIONS = {
  PLANNED: ['IN_PROGRESS', 'ON_HOLD'],
  IN_PROGRESS: ['DONE', 'ON_HOLD'],
  DONE: ['IN_PROGRESS'],
  ON_HOLD: ['PLANNED', 'IN_PROGRESS'],
};

export function isValidTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── DB row → camelCase 변환 ───────────────────────────────────────────────────
function rowToTodo(row) {
  return {
    todoId: row.todo_id,
    userId: row.user_id,
    teamId: row.team_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    status: row.status,
    startDate: row.start_date,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── 팀 멤버 역할 조회 ─────────────────────────────────────────────────────────
async function getTeamRole(teamId, userId) {
  const { rows } = await pool.query(
    `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );
  return rows.length > 0 ? rows[0].role : null;
}

// ─── 내가 소속된 팀 ID 목록 ────────────────────────────────────────────────────
async function getMyTeamIds(userId) {
  const { rows } = await pool.query(
    `SELECT team_id FROM team_members WHERE user_id = $1`,
    [userId]
  );
  return rows.map((r) => r.team_id);
}

// ─── createTodo ────────────────────────────────────────────────────────────────
export async function createTodo(userId, { title, description, status, startDate, dueDate, categoryId, teamId }) {
  if (teamId) {
    const role = await getTeamRole(teamId, userId);
    if (role === null) {
      throw new ForbiddenError('해당 팀에 접근 권한이 없습니다.');
    }
    if (role === 'VIEWER') {
      throw new ForbiddenError('뷰어는 할일을 생성할 수 없습니다.');
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, team_id, category_id, title, description, status, start_date, due_date)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::todo_status, 'PLANNED'), $7, $8)
     RETURNING *`,
    [
      teamId ? null : userId,
      teamId ?? null,
      categoryId ?? null,
      title,
      description ?? null,
      status ?? null,
      startDate ?? null,
      dueDate ?? null,
    ]
  );

  const todo = rowToTodo(rows[0]);
  await logAudit('Todo', todo.todoId, 'CREATE', userId, null, todo);
  return todo;
}

// ─── getTodo ───────────────────────────────────────────────────────────────────
export async function getTodo(todoId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM todos WHERE todo_id = $1`,
    [todoId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('할일을 찾을 수 없습니다.');
  }

  const todo = rows[0];

  if (todo.team_id === null) {
    // 개인 할일: user_id 일치 검증
    if (todo.user_id !== userId) {
      throw new ForbiddenError('해당 할일에 접근 권한이 없습니다.');
    }
  } else {
    // 팀 할일: 팀 멤버 검증
    const role = await getTeamRole(todo.team_id, userId);
    if (role === null) {
      throw new ForbiddenError('해당 팀 할일에 접근 권한이 없습니다.');
    }
  }

  return rowToTodo(todo);
}

// ─── listTodos ─────────────────────────────────────────────────────────────────
export async function listTodos(userId, { status, categoryId, startDate, endDate, search, page, limit } = {}) {
  const resolvedPage = page ?? 1;
  const resolvedLimit = limit ?? 20;
  const offset = (resolvedPage - 1) * resolvedLimit;

  const myTeamIds = await getMyTeamIds(userId);

  const conditions = [];
  const params = [userId];
  let paramIdx = 2;

  // 개인 할일 + 소속 팀 할일
  if (myTeamIds.length > 0) {
    const teamPlaceholders = myTeamIds.map((_, i) => `$${paramIdx + i}`).join(', ');
    conditions.push(
      `((t.team_id IS NULL AND t.user_id = $1) OR (t.team_id IN (${teamPlaceholders})))`
    );
    myTeamIds.forEach((id) => params.push(id));
    paramIdx += myTeamIds.length;
  } else {
    conditions.push(`(t.team_id IS NULL AND t.user_id = $1)`);
  }

  if (status) {
    conditions.push(`t.status = $${paramIdx}`);
    params.push(status);
    paramIdx++;
  }

  if (categoryId) {
    conditions.push(`t.category_id = $${paramIdx}`);
    params.push(categoryId);
    paramIdx++;
  }

  if (startDate && endDate) {
    conditions.push(`t.due_date BETWEEN $${paramIdx} AND $${paramIdx + 1}`);
    params.push(startDate, endDate);
    paramIdx += 2;
  } else if (startDate) {
    conditions.push(`t.due_date >= $${paramIdx}`);
    params.push(startDate);
    paramIdx++;
  } else if (endDate) {
    conditions.push(`t.due_date <= $${paramIdx}`);
    params.push(endDate);
    paramIdx++;
  }

  if (search) {
    conditions.push(`t.title ILIKE $${paramIdx}`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) FROM todos t ${whereClause}`;
  const { rows: countRows } = await pool.query(countQuery, params);
  const total = parseInt(countRows[0].count, 10);

  const dataParams = [...params, resolvedLimit, offset];
  const dataQuery = `
    SELECT t.* FROM todos t
    ${whereClause}
    ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;
  const { rows } = await pool.query(dataQuery, dataParams);

  return {
    todos: rows.map(rowToTodo),
    total,
    page: resolvedPage,
    limit: resolvedLimit,
  };
}

// ─── getTodayTodos ─────────────────────────────────────────────────────────────
export async function getTodayTodos(userId) {
  const today = getKSTTodayString();
  const myTeamIds = await getMyTeamIds(userId);

  let ownershipClause;
  const params = [userId, today];
  let paramIdx = 3;

  if (myTeamIds.length > 0) {
    const teamPlaceholders = myTeamIds.map((_, i) => `$${paramIdx + i}`).join(', ');
    ownershipClause = `((user_id = $1 AND team_id IS NULL) OR team_id IN (${teamPlaceholders}))`;
    myTeamIds.forEach((id) => params.push(id));
  } else {
    ownershipClause = `(user_id = $1 AND team_id IS NULL)`;
  }

  const { rows } = await pool.query(
    `SELECT * FROM todos
     WHERE ${ownershipClause}
       AND start_date <= $2
       AND due_date >= $2
     ORDER BY due_date ASC NULLS LAST, created_at DESC`,
    params
  );

  return rows.map(rowToTodo);
}

// ─── getThisWeekTodos ──────────────────────────────────────────────────────────
export async function getThisWeekTodos(userId) {
  const { start, end } = getKSTWeekRange();
  const myTeamIds = await getMyTeamIds(userId);

  let ownershipClause;
  const params = [userId, start, end];
  let paramIdx = 4;

  if (myTeamIds.length > 0) {
    const teamPlaceholders = myTeamIds.map((_, i) => `$${paramIdx + i}`).join(', ');
    ownershipClause = `((user_id = $1 AND team_id IS NULL) OR team_id IN (${teamPlaceholders}))`;
    myTeamIds.forEach((id) => params.push(id));
  } else {
    ownershipClause = `(user_id = $1 AND team_id IS NULL)`;
  }

  const { rows } = await pool.query(
    `SELECT * FROM todos
     WHERE ${ownershipClause}
       AND due_date BETWEEN $2 AND $3
     ORDER BY due_date ASC NULLS LAST, created_at DESC`,
    params
  );

  return rows.map(rowToTodo);
}

// ─── updateTodo ────────────────────────────────────────────────────────────────
export async function updateTodo(todoId, userId, { title, description, status, startDate, dueDate, categoryId }) {
  // 권한 검증 (getTodo 내부에서 처리)
  const before = await getTodo(todoId, userId);

  const setClauses = [];
  const params = [];
  let paramIdx = 1;

  if (title !== undefined) {
    setClauses.push(`title = $${paramIdx}`);
    params.push(title);
    paramIdx++;
  }
  if (description !== undefined) {
    setClauses.push(`description = $${paramIdx}`);
    params.push(description);
    paramIdx++;
  }
  if (status !== undefined) {
    setClauses.push(`status = $${paramIdx}`);
    params.push(status);
    paramIdx++;
  }
  if (startDate !== undefined) {
    setClauses.push(`start_date = $${paramIdx}`);
    params.push(startDate);
    paramIdx++;
  }
  if (dueDate !== undefined) {
    setClauses.push(`due_date = $${paramIdx}`);
    params.push(dueDate);
    paramIdx++;
  }
  if (categoryId !== undefined) {
    setClauses.push(`category_id = $${paramIdx}`);
    params.push(categoryId);
    paramIdx++;
  }

  if (setClauses.length === 0) {
    return before;
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(todoId);

  const { rows } = await pool.query(
    `UPDATE todos SET ${setClauses.join(', ')} WHERE todo_id = $${paramIdx} RETURNING *`,
    params
  );

  const after = rowToTodo(rows[0]);
  await logAudit('Todo', todoId, 'UPDATE', userId, before, after);
  return after;
}

// ─── updateTodoStatus ──────────────────────────────────────────────────────────
export async function updateTodoStatus(todoId, userId, newStatus) {
  const { rows } = await pool.query(
    `SELECT * FROM todos WHERE todo_id = $1`,
    [todoId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('할일을 찾을 수 없습니다.');
  }

  const todo = rows[0];
  const currentStatus = todo.status;

  // 권한 검증
  if (todo.team_id === null) {
    if (todo.user_id !== userId) {
      throw new ForbiddenError('해당 할일에 접근 권한이 없습니다.');
    }
  } else {
    const role = await getTeamRole(todo.team_id, userId);
    if (role === null) {
      throw new ForbiddenError('해당 팀 할일에 접근 권한이 없습니다.');
    }
  }

  // 상태 전이 검증
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new UnprocessableError('허용되지 않은 상태 전이입니다.');
  }

  const { rows: updated } = await pool.query(
    `UPDATE todos SET status = $1, updated_at = NOW() WHERE todo_id = $2 RETURNING *`,
    [newStatus, todoId]
  );

  const before = rowToTodo(todo);
  const after = rowToTodo(updated[0]);
  await logAudit('Todo', todoId, 'UPDATE', userId, before, after);
  return after;
}

// ─── deleteTodo ────────────────────────────────────────────────────────────────
export async function deleteTodo(todoId, userId) {
  const before = await getTodo(todoId, userId);

  await pool.query(
    `DELETE FROM todos WHERE todo_id = $1`,
    [todoId]
  );

  await logAudit('Todo', todoId, 'DELETE', userId, before, null);
}
