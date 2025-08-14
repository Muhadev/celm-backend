import { Router } from 'express';
import { RegistrationController } from '../controllers/RegistrationController';
import rateLimit from 'express-rate-limit';

const router = Router();
const registrationController = new RegistrationController();

// Rate limiting
const registrationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts, please try again later',
});

// Step 1: Start registration with email
router.post('/start', registrationRateLimit, registrationController.startRegistration);

// Verify email
router.post('/verify-email/:token', registrationController.verifyEmail);

// for URL availability checking:
router.get('/check-shop-url', registrationController.checkShopUrlAvailability);

// Google OAuth registration
router.post('/google', registrationController.googleAuth);

// Step 2: Personal information
router.post('/personal-info', registrationController.submitPersonalInfo);

// Step 3: Business type
router.post('/business-type', registrationController.submitBusinessType);

// Step 4: Shop details
router.post('/shop-details', registrationController.submitShopDetails);

// Step 5: Location and complete
router.post('/location', registrationController.submitLocation);

export { router as registrationRoutes };