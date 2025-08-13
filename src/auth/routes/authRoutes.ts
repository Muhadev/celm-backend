import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/authMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login with shop URL and password
router.post('/login', authRateLimit, authController.login);

// Refresh tokens
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authMiddleware, authController.logout);

// Check authentication status
router.get('/check', authMiddleware, authController.checkAuth);

export { router as authRoutes };