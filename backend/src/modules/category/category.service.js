import pool from '../../config/database.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../shared/errors/index.js';
import { logAudit } from '../audit/audit.service.js';

// ─── DB row → camelCase 변환 ───────────────────────────────────────────────────
function mapCategory(row) {
  return {
    categoryId: row.category_id,
    ownerId: row.owner_id,
    ownerType: row.owner_type,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
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

// ─── createCategory ────────────────────────────────────────────────────────────
export async function createCategory(userId, { name, color, teamId }) {
  let ownerId;
  let ownerType;

  if (teamId) {
    // 팀 카테고리: ADMIN만 생성 가능
    const role = await getTeamRole(teamId, userId);
    if (role === null) {
      throw new ForbiddenError('해당 팀에 접근 권한이 없습니다.');
    }
    if (role !== 'ADMIN') {
      throw new ForbiddenError('팀 카테고리는 ADMIN만 생성할 수 있습니다.');
    }
    ownerId = teamId;
    ownerType = 'TEAM';
  } else {
    // 개인 카테고리
    ownerId = userId;
    ownerType = 'USER';
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO categories (owner_id, owner_type, name, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [ownerId, ownerType, name, color ?? null]
    );
    const cat = mapCategory(rows[0]);
    await logAudit('Category', cat.categoryId, 'CREATE', userId, null, cat);
    return cat;
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictError('이미 같은 이름의 카테고리가 존재합니다.');
    }
    throw err;
  }
}

// ─── getCategories ─────────────────────────────────────────────────────────────
export async function getCategories(userId) {
  const { rows } = await pool.query(
    `SELECT * FROM categories
     WHERE (owner_type = 'USER' AND owner_id = $1)
        OR (owner_type = 'TEAM' AND owner_id IN (
              SELECT team_id FROM team_members WHERE user_id = $1
            ))
     ORDER BY created_at ASC`,
    [userId]
  );
  return rows.map(mapCategory);
}

// ─── getCategory ───────────────────────────────────────────────────────────────
export async function getCategory(categoryId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM categories WHERE category_id = $1`,
    [categoryId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  }

  const cat = rows[0];

  if (cat.owner_type === 'USER') {
    if (cat.owner_id !== userId) {
      throw new ForbiddenError('해당 카테고리에 접근 권한이 없습니다.');
    }
  } else {
    // TEAM 카테고리: 멤버면 조회 가능
    const role = await getTeamRole(cat.owner_id, userId);
    if (role === null) {
      throw new ForbiddenError('해당 팀 카테고리에 접근 권한이 없습니다.');
    }
  }

  return mapCategory(cat);
}

// ─── updateCategory ────────────────────────────────────────────────────────────
export async function updateCategory(categoryId, userId, { name, color }) {
  const { rows } = await pool.query(
    `SELECT * FROM categories WHERE category_id = $1`,
    [categoryId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  }

  const cat = rows[0];

  // 권한 검증
  if (cat.owner_type === 'USER') {
    if (cat.owner_id !== userId) {
      throw new ForbiddenError('해당 카테고리를 수정할 권한이 없습니다.');
    }
  } else {
    const role = await getTeamRole(cat.owner_id, userId);
    if (role !== 'ADMIN') {
      throw new ForbiddenError('팀 카테고리는 ADMIN만 수정할 수 있습니다.');
    }
  }

  // color: undefined = 기존값 유지, null = 명시적으로 NULL 저장
  const newColor = color === undefined ? cat.color : color;

  try {
    const { rows: updated } = await pool.query(
      `UPDATE categories
       SET name  = COALESCE($1, name),
           color = $2
       WHERE category_id = $3
       RETURNING *`,
      [name ?? null, newColor, categoryId]
    );
    const before = mapCategory(cat);
    const after = mapCategory(updated[0]);
    await logAudit('Category', categoryId, 'UPDATE', userId, before, after);
    return after;
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictError('이미 같은 이름의 카테고리가 존재합니다.');
    }
    throw err;
  }
}

// ─── deleteCategory ────────────────────────────────────────────────────────────
export async function deleteCategory(categoryId, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM categories WHERE category_id = $1`,
    [categoryId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  }

  const cat = rows[0];

  // 권한 검증
  if (cat.owner_type === 'USER') {
    if (cat.owner_id !== userId) {
      throw new ForbiddenError('해당 카테고리를 삭제할 권한이 없습니다.');
    }
  } else {
    const role = await getTeamRole(cat.owner_id, userId);
    if (role !== 'ADMIN') {
      throw new ForbiddenError('팀 카테고리는 ADMIN만 삭제할 수 있습니다.');
    }
  }

  const before = mapCategory(cat);
  await pool.query(`DELETE FROM categories WHERE category_id = $1`, [categoryId]);
  await logAudit('Category', categoryId, 'DELETE', userId, before, null);
  // todos.category_id는 ON DELETE SET NULL으로 자동 처리됨
}
