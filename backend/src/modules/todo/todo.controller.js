import {
  createTodo,
  getTodo,
  listTodos,
  getTodayTodos,
  getThisWeekTodos,
  updateTodo,
  updateTodoStatus,
  deleteTodo,
} from './todo.service.js';
import { logApiRequest, logApiSuccess, logApiError } from '../../shared/utils/logger.js';

export async function createTodoController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'todo.create');
    const todo = await createTodo(userId, req.body);
    logApiSuccess(req, 'todo.create', { todoId: todo.todoId, status: todo.status });
    return res.status(201).json(todo);
  } catch (err) {
    logApiError(req, 'todo.create', err);
    return next(err);
  }
}

export async function getTodoController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'todo.get');
    const todo = await getTodo(req.params.id, userId);
    logApiSuccess(req, 'todo.get', { todoId: todo.todoId, status: todo.status });
    return res.status(200).json(todo);
  } catch (err) {
    logApiError(req, 'todo.get', err);
    return next(err);
  }
}

export async function listTodosController(req, res, next) {
  try {
    const { userId } = req.user;
    const { status, categoryId, startDate, endDate, search, page, limit } = req.query;
    logApiRequest(req, 'todo.list');
    const result = await listTodos(userId, {
      status,
      categoryId,
      startDate,
      endDate,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    logApiSuccess(req, 'todo.list', { total: result.total, count: result.todos.length });
    return res.status(200).json(result);
  } catch (err) {
    logApiError(req, 'todo.list', err);
    return next(err);
  }
}

export async function getTodayTodosController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'todo.getToday');
    const todos = await getTodayTodos(userId);
    logApiSuccess(req, 'todo.getToday', { count: todos.length });
    return res.status(200).json(todos);
  } catch (err) {
    logApiError(req, 'todo.getToday', err);
    return next(err);
  }
}

export async function getThisWeekTodosController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'todo.getThisWeek');
    const todos = await getThisWeekTodos(userId);
    logApiSuccess(req, 'todo.getThisWeek', { count: todos.length });
    return res.status(200).json(todos);
  } catch (err) {
    logApiError(req, 'todo.getThisWeek', err);
    return next(err);
  }
}

export async function updateTodoController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'todo.update');
    const todo = await updateTodo(req.params.id, userId, req.body);
    logApiSuccess(req, 'todo.update', { todoId: todo.todoId, status: todo.status });
    return res.status(200).json(todo);
  } catch (err) {
    logApiError(req, 'todo.update', err);
    return next(err);
  }
}

export async function updateTodoStatusController(req, res, next) {
  try {
    const { userId } = req.user;
    const { status } = req.body;
    logApiRequest(req, 'todo.updateStatus', { requestedStatus: status });
    const todo = await updateTodoStatus(req.params.id, userId, status);
    logApiSuccess(req, 'todo.updateStatus', { todoId: todo.todoId, status: todo.status });
    return res.status(200).json(todo);
  } catch (err) {
    logApiError(req, 'todo.updateStatus', err);
    return next(err);
  }
}

export async function deleteTodoController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'todo.delete');
    await deleteTodo(req.params.id, userId);
    logApiSuccess(req, 'todo.delete', { todoId: req.params.id });
    return res.status(204).send();
  } catch (err) {
    logApiError(req, 'todo.delete', err);
    return next(err);
  }
}
