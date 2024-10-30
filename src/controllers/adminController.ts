import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        company: true,
        virtualMachines: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    res.json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching users', 500);
  }
};

export const getSystemStats = async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      activeVMs,
      totalRevenue,
      recentPayments,
      allVMs
    ] = await Promise.all([
      // Get total users
      prisma.user.count(),

      // Get active VMs
      prisma.virtualMachine.count({
        where: {
          status: 'RUNNING',
        },
      }),

      // Calculate total revenue
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),

      // Get recent payments
      prisma.payment.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
        },
      }),

      // Get all VMs with their plans
      prisma.virtualMachine.findMany({
        include: {
          plan: true,
        },
      }),
    ]);

    // Calculate resource utilization from VMs and their plans
    const resourceUtilization = allVMs.reduce((acc, vm) => ({
      totalCPU: acc.totalCPU + (vm.plan?.cpu || 0),
      totalRAM: acc.totalRAM + (vm.plan?.ram || 0),
      totalStorage: acc.totalStorage + (vm.plan?.storage || 0),
    }), {
      totalCPU: 0,
      totalRAM: 0,
      totalStorage: 0,
    });

    const stats = {
      users: {
        total: totalUsers,
      },
      virtualMachines: {
        total: allVMs.length,
        active: activeVMs,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
      },
      recentPayments,
      resources: {
        cpu: resourceUtilization.totalCPU,
        ram: resourceUtilization.totalRAM,
        storage: resourceUtilization.totalStorage,
      },
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching system stats', 500);
  }
};

export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        virtualMachines: {
          include: {
            plan: true,
            usageMetrics: {
              take: 24,
              orderBy: {
                timestamp: 'desc',
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        tickets: true,
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
    throw new AppError('Error fetching user details', 500);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });

    res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error updating user status', 500);
  }
};

export const getSystemMetrics = async (_req: AuthRequest, res: Response) => {
  try {
    // Get last 24 hours of metrics
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const metrics = await prisma.usageMetric.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: {
          gte: startDate,
        },
      },
      _avg: {
        cpuUsage: true,
        ramUsage: true,
        storageUsage: true,
        bandwidthUsage: true,
      },
    });

    res.json({
      status: 'success',
      data: metrics,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching system metrics', 500);
  }
};