import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/AppError';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new ValidationError(errorMessage);
    }
    
    req.body = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new ValidationError(errorMessage);
    }
    
    req.params = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new ValidationError(errorMessage);
    }
    
    req.query = value;
    next();
  };
};