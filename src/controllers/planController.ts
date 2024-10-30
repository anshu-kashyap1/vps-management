import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const getAllPlans = async (_req: AuthRequest, res: Response) => {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: 'asc',
      },
    });

    res.json({
      status: 'success',
      data: plans,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching plans', 500);
  }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Not authorized to create plans', 403);
    }

    const { 
      name, 
      description, 
      cpu, 
      ram, 
      storage, 
      bandwidth, 
      price, 
      billingCycle 
    } = req.body;

    // Validate required fields
    if (!name || !cpu || !ram || !storage || !bandwidth || !price || !billingCycle) {
      throw new AppError('Please provide all required plan details', 400);
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        cpu: Number(cpu),
        ram: Number(ram),
        storage: Number(storage),
        bandwidth: Number(bandwidth),
        price: Number(price),
        billingCycle,
        isActive: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: plan,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error creating plan', 500);
  }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Not authorized to update plans', 403);
    }

    const { id } = req.params;
    const { 
      name, 
      description, 
      cpu, 
      ram, 
      storage, 
      bandwidth, 
      price, 
      billingCycle,
      isActive 
    } = req.body;

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        description,
        cpu: cpu ? Number(cpu) : undefined,
        ram: ram ? Number(ram) : undefined,
        storage: storage ? Number(storage) : undefined,
        bandwidth: bandwidth ? Number(bandwidth) : undefined,
        price: price ? Number(price) : undefined,
        billingCycle,
        isActive,
      },
    });

    res.json({
      status: 'success',
      data: plan,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error updating plan', 500);
  }
};

export const getPlanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        virtualMachines: req.user?.role === 'ADMIN',
      },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    // Create a response object based on user role
    const responseData = {
      ...plan,
      virtualMachines: req.user?.role === 'ADMIN' ? plan.virtualMachines : undefined,
    };

    res.json({
      status: 'success',
      data: responseData,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching plan', 500);
  }
};

export const deletePlan = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AppError('Not authorized to delete plans', 403);
    }

    const { id } = req.params;

    // Check if plan is in use
    const planInUse = await prisma.virtualMachine.findFirst({
      where: { planId: id },
    });

    if (planInUse) {
      throw new AppError('Cannot delete plan that is in use', 400);
    }

    await prisma.plan.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'Plan deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error deleting plan', 500);
  }
};