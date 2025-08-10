import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { authenticate, optionalAuthenticate } from '@/middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window per IP
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour per IP
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const emailVerificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 verification email requests per 15 minutes per IP
  message: 'Too many verification email requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', passwordResetRateLimit, authController.forgotPassword);
router.post('/reset-password', authRateLimit, authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', emailVerificationRateLimit, authController.resendVerificationEmail);

// Check auth status (works with or without token)
router.get('/check', optionalAuthenticate, authController.checkAuth);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.post('/change-password', authController.changePassword);

export { router as authRoutes };