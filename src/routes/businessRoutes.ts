import { Router } from 'express';
import { BusinessController } from '@/controllers/BusinessController';
import { authenticate, checkOwnership } from '@/middleware/auth';
import { validateRequest, validateParams, validateQuery } from '@/middleware/validation';
import Joi from 'joi';

const router = Router();
const businessController = new BusinessController();

// Validation schemas
const createBusinessSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).optional(),
  type: Joi.string().valid('services', 'products', 'both').default('services'),
  services: Joi.array().items(Joi.string()).default([]),
  categories: Joi.array().items(Joi.string()).default([]),
  website: Joi.string().uri().optional(),
  location: Joi.object({
    country: Joi.string().optional(),
    state: Joi.string().optional(),
    city: Joi.string().optional(),
    address: Joi.string().optional(),
    postalCode: Joi.string().optional(),
    timezone: Joi.string().optional(),
  }).optional(),
  contact: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    website: Joi.string().uri().optional(),
    socialMedia: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

const updateBusinessSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  type: Joi.string().valid('services', 'products', 'both').optional(),
  services: Joi.array().items(Joi.string()).optional(),
  categories: Joi.array().items(Joi.string()).optional(),
  website: Joi.string().uri().optional(),
  location: Joi.object({
    country: Joi.string().optional(),
    state: Joi.string().optional(),
    city: Joi.string().optional(),
    address: Joi.string().optional(),
    postalCode: Joi.string().optional(),
    timezone: Joi.string().optional(),
  }).optional(),
  contact: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    website: Joi.string().uri().optional(),
    socialMedia: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

const getBusinessesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('draft', 'active', 'inactive', 'suspended', 'verified').optional(),
  type: Joi.string().valid('services', 'products', 'both').optional(),
  category: Joi.string().optional(),
  search: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  country: Joi.string().optional(),
});

const paramsSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

// Public routes (no authentication required)
// Get all active businesses
router.get(
  '/',
  validateQuery(getBusinessesQuerySchema),
  businessController.getBusinesses
);

// Get business by ID (public view)
router.get(
  '/:id',
  validateParams(paramsSchema),
  businessController.getBusinessById
);

// Protected routes (require authentication)
router.use(authenticate);

// Create business
router.post(
  '/',
  validateRequest(createBusinessSchema),
  businessController.createBusiness
);

// Get businesses by current user
router.get('/owner/me', businessController.getMyBusinesses);

// Get businesses by owner ID
router.get('/owner/:ownerId', businessController.getBusinessesByOwner);

// Update business (owner only)
router.put(
  '/:id',
  validateParams(paramsSchema),
  validateRequest(updateBusinessSchema),
  checkOwnership('id'),
  businessController.updateBusiness
);

// Delete business (owner only)
router.delete(
  '/:id',
  validateParams(paramsSchema),
  checkOwnership('id'),
  businessController.deleteBusiness
);

// Upload business logo (owner only)
router.post(
  '/:id/upload-logo',
  validateParams(paramsSchema),
  checkOwnership('id'),
  businessController.uploadLogo
);

// Upload business images (owner only)
router.post(
  '/:id/upload-images',
  validateParams(paramsSchema),
  checkOwnership('id'),
  businessController.uploadImages
);

export { router as businessRoutes };
