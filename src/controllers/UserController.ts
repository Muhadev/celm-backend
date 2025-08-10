import { Request, Response, NextFunction } from 'express';
import { User, UserStatus, UserRole } from '@/models/User';
import { AppError, NotFoundError, ValidationError } from '@/utils/AppError';
import { logger } from '@/utils/logger';

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, status, role, search } = req.query as any;
      
      const filters: Partial<Pick<User, 'status' | 'role'>> = {};
      if (status) filters.status = status;
      if (role) filters.role = role;

      const result = await User.findAll(parseInt(page), parseInt(limit), filters);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: req.user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        throw new BadRequestError('User ID is required');
      }
      
      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { firstName, lastName, phoneNumber, profileImage } = req.body;

      // Update user properties
      if (firstName) req.user.firstName = firstName;
      if (lastName) req.user.lastName = lastName;
      if (phoneNumber) req.user.phoneNumber = phoneNumber;
      if (profileImage) req.user.profileImage = profileImage;

      const updatedUser = await req.user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        throw new BadRequestError('User ID is required');
      }
      
      const { firstName, lastName, phoneNumber, profileImage } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Update user properties
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      if (profileImage) user.profileImage = profileImage;

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        throw new BadRequestError('User ID is required');
      }
      
      const { status } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      user.status = status;
      const updatedUser = await user.save();

      logger.info(`User ${id} status updated to ${status} by ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: updatedUser.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        throw new BadRequestError('User ID is required');
      }
      
      const { role } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      user.role = role;
      const updatedUser = await user.save();

      logger.info(`User ${id} role updated to ${role} by ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: updatedUser.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        throw new BadRequestError('User ID is required');
      }

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const success = await user.delete();
      if (!success) {
        throw new AppError('Failed to delete user', 500);
      }

      logger.info(`User ${id} deleted by ${req.user?.id}`);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
