import { Response } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../middleware/auth';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        phoneNumber: true,
        company: true,
        billingEmail: true,
        virtualMachines: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching profile', 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Not authenticated', 401);
    }

    const { fullName, phoneNumber, company, currentPassword, newPassword } = req.body;

    // If updating password, verify current password
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user with new password
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          passwordHash: hashedPassword,
        },
      });
    }

    // Update other profile information
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: fullName,
        phoneNumber: phoneNumber,
        company: company,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        company: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    res.json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error updating profile', 500);
  }
};

// Add function to get VM list for user
export const getUserVMs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Not authenticated', 401);
    }

    const vms = await prisma.virtualMachine.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        ipAddress: true,
        plan: {
          select: {
            name: true,
            cpu: true,
            ram: true,
            storage: true,
          },
        },
      },
    });

    res.json({
      status: 'success',
      data: vms,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching user VMs', 500);
  }
};

// Add function to get user billing information
export const getBillingInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        billingEmail: true,
        billingInfo: true,
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            transactionId: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching billing information', 500);
  }
};