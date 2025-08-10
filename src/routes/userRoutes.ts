import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { authenticate, authorize, adminOnly } from '@/middleware/auth';
import { validateRequest, validateParams, validateQuery } from '@/middleware/validation';
import Joi from 'joi';

const router = Router();
const userController = new UserController();

// Validation schemas
const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
  role: Joi.string().valid('user', 'admin', 'super_admin').optional(),
  search: Joi.string().optional(),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phoneNumber: Joi.string().optional(),
  profileImage: Joi.string().uri().optional(),
});

const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').required(),
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'admin', 'super_admin').required(),
});

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get(
  '/',
  adminOnly,
  validateQuery(getUsersQuerySchema),
  userController.getUsers
);

// Get current user profile
router.get('/profile', userController.getCurrentUser);

// Get user by ID
router.get(
  '/:id',
  validateParams(paramsSchema),
  userController.getUserById
);

// Update current user profile
router.put(
  '/profile',
  validateRequest(updateUserSchema),
  userController.updateCurrentUser
);

// Update user by ID (admin only)
router.put(
  '/:id',
  adminOnly,
  validateParams(paramsSchema),
  validateRequest(updateUserSchema),
  userController.updateUser
);

// Update user status (admin only)
router.patch(
  '/:id/status',
  adminOnly,
  validateParams(paramsSchema),
  validateRequest(updateUserStatusSchema),
  userController.updateUserStatus
);

// Update user role (admin only)
router.patch(
  '/:id/role',
  adminOnly,
  validateParams(paramsSchema),
  validateRequest(updateUserRoleSchema),
  userController.updateUserRole
);

// Delete user (admin only)
router.delete(
  '/:id',
  adminOnly,
  validateParams(paramsSchema),
  userController.deleteUser
);

export { router as userRoutes };
