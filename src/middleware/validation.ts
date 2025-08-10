import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '@/utils/AppError';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      throw new ValidationError(errorMessage);
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      throw new ValidationError(errorMessage);
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      throw new ValidationError(errorMessage);
    }

    req.params = value;
    next();
  };
};
