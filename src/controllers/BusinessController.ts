import { Request, Response, NextFunction } from 'express';
import { Business, BusinessStatus } from '@/models/Business';
import { AppError, NotFoundError, ValidationError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import multer from 'multer';
import { config } from '@/config';
import path from 'path';

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class BusinessController {
  private upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, config.fileUpload.uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `business-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: config.fileUpload.maxFileSize,
    },
    fileFilter: (req, file, cb) => {
      if (config.fileUpload.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError('Invalid file type', 400));
      }
    }
  });

  async getBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, status, type, category, search, city, state, country } = req.query as any;
      
      // For public view, only show active/verified businesses
      const publicStatuses: BusinessStatus[] = [BusinessStatus.ACTIVE, BusinessStatus.VERIFIED];
      
      const result = await Business.findAll(
        parseInt(page), 
        parseInt(limit), 
        { status: status || publicStatuses, type, category, search, city, state, country }
      );

      res.status(200).json({
        success: true,
        message: 'Businesses retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBusinessById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        throw new BadRequestError('Business ID is required');
      }
      
      const business = await Business.findById(id);
      if (!business) {
        throw new NotFoundError('Business not found');
      }

      res.status(200).json({
        success: true,
        message: 'Business retrieved successfully',
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  async createBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('User not authenticated', 401);
      }

      const businessData = {
        ...req.body,
        ownerId: req.user.id,
      };

      const business = new Business(businessData);
      const savedBusiness = await business.save();

      logger.info(`Business created: ${savedBusiness.id} by user: ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Business created successfully',
        data: savedBusiness,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        throw new AppError('User not authenticated', 401);
      }

      const businesses = await Business.findByOwnerId(req.user.id);

      res.status(200).json({
        success: true,
        message: 'User businesses retrieved successfully',
        data: businesses,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBusinessesByOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ownerId } = req.params;
      
      if (!ownerId) {
        throw new BadRequestError('Owner ID is required');
      }
      
      const businesses = await Business.findByOwnerId(ownerId);

      res.status(200).json({
        success: true,
        message: 'Owner businesses retrieved successfully',
        data: businesses,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        throw new BadRequestError('Business ID is required');
      }
      
      const business = await Business.findById(id);
      if (!business) {
        throw new NotFoundError('Business not found');
      }

      // Update business properties
      Object.assign(business, req.body);
      const updatedBusiness = await business.save();

      res.status(200).json({
        success: true,
        message: 'Business updated successfully',
        data: updatedBusiness,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBusiness(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        throw new BadRequestError('Business ID is required');
      }

      const business = await Business.findById(id);
      if (!business) {
        throw new NotFoundError('Business not found');
      }

      const success = await business.delete();
      if (!success) {
        throw new AppError('Failed to delete business', 500);
      }

      logger.info(`Business deleted: ${id} by user: ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'Business deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.upload.single('logo')(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!req.file) {
          throw new ValidationError('No file uploaded');
        }

        const id = req.params.id;
        
        if (!id) {
          throw new BadRequestError('Business ID is required');
        }
        
        const business = await Business.findById(id);
        if (!business) {
          throw new NotFoundError('Business not found');
        }

        business.logo = req.file.path;
        const updatedBusiness = await business.save();

        res.status(200).json({
          success: true,
          message: 'Logo uploaded successfully',
          data: {
            logo: updatedBusiness.logo,
          },
        });
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.upload.array('images', 10)(req, res, async (err) => {
        if (err) {
          return next(err);
        }

        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          throw new ValidationError('No files uploaded');
        }

        const id = req.params.id;
        
        if (!id) {
          throw new BadRequestError('Business ID is required');
        }
        
        const business = await Business.findById(id);
        if (!business) {
          throw new NotFoundError('Business not found');
        }

        const imagePaths = req.files.map(file => file.path);
        business.images = [...(business.images || []), ...imagePaths];
        const updatedBusiness = await business.save();

        res.status(200).json({
          success: true,
          message: 'Images uploaded successfully',
          data: {
            images: updatedBusiness.images,
          },
        });
      });
    } catch (error) {
      next(error);
    }
  }
}
