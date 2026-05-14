import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from './category.service.js';
import { logApiRequest, logApiSuccess, logApiError } from '../../shared/utils/logger.js';

export async function createCategoryController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'category.create');
    const category = await createCategory(userId, req.body);
    logApiSuccess(req, 'category.create', { categoryId: category.categoryId, name: category.name });
    return res.status(201).json(category);
  } catch (err) {
    logApiError(req, 'category.create', err);
    return next(err);
  }
}

export async function getCategoriesController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'category.list');
    const categories = await getCategories(userId);
    logApiSuccess(req, 'category.list', { count: categories.length });
    return res.status(200).json(categories);
  } catch (err) {
    logApiError(req, 'category.list', err);
    return next(err);
  }
}

export async function getCategoryController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'category.get');
    const category = await getCategory(req.params.id, userId);
    logApiSuccess(req, 'category.get', { categoryId: category.categoryId, name: category.name });
    return res.status(200).json(category);
  } catch (err) {
    logApiError(req, 'category.get', err);
    return next(err);
  }
}

export async function updateCategoryController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'category.update');
    const category = await updateCategory(req.params.id, userId, req.body);
    logApiSuccess(req, 'category.update', { categoryId: category.categoryId, name: category.name });
    return res.status(200).json(category);
  } catch (err) {
    logApiError(req, 'category.update', err);
    return next(err);
  }
}

export async function deleteCategoryController(req, res, next) {
  try {
    const { userId } = req.user;
    logApiRequest(req, 'category.delete');
    await deleteCategory(req.params.id, userId);
    logApiSuccess(req, 'category.delete', { categoryId: req.params.id });
    return res.status(204).send();
  } catch (err) {
    logApiError(req, 'category.delete', err);
    return next(err);
  }
}
