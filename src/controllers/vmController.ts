// src/controllers/vmController.ts

import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { proxmoxService } from '../services/proxmox.service';
import prisma from '../utils/prisma';
import { VMStatus } from '@prisma/client';

export const getAllVMs = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as VMStatus | undefined;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [vms, total] = await Promise.all([
      prisma.virtualMachine.findMany({
        where,
        include: {
          plan: true,
          usageMetrics: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.virtualMachine.count({ where }),
    ]);

    // Fetch real-time stats for running VMs
    const vmsWithStats = await Promise.all(
      vms.map(async (vm) => {
        if (vm.status === 'RUNNING' && vm.proxmoxVmId) {
          try {
            const stats = await proxmoxService.getVMStats(vm.proxmoxVmId);
            return { ...vm, currentStats: stats };
          } catch (error) {
            console.error(`Failed to fetch stats for VM ${vm.id}:`, error);
            return vm;
          }
        }
        return vm;
      })
    );

    res.json({
      status: 'success',
      data: vmsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching VMs', 500);
  }
};

export const getVMById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const vm = await prisma.virtualMachine.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        plan: true,
        usageMetrics: {
          orderBy: { timestamp: 'desc' },
          take: 24,
        },
        backups: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vm) {
      throw new AppError('VM not found', 404);
    }

    // Get real-time stats if VM is running
    if (vm.status === 'RUNNING' && vm.proxmoxVmId) {
      try {
        const stats = await proxmoxService.getVMStats(vm.proxmoxVmId);
        vm.currentStats = stats;
      } catch (error) {
        console.error(`Failed to fetch stats for VM ${vm.id}:`, error);
      }
    }

    res.json({
      status: 'success',
      data: vm,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching VM details', 500);
  }
};

export const createVM = async (req: Request, res: Response) => {
  try {
    const { name, planId } = req.body;
    const userId = req.user!.id;

    // Validate input
    if (!name || !planId) {
      throw new AppError('Please provide name and plan ID', 400);
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    // Check user's VM limit (if applicable)
    const userVMCount = await prisma.virtualMachine.count({
      where: { userId },
    });

    if (userVMCount >= 5) { // Example limit
      throw new AppError('VM limit reached', 400);
    }

    // Create VM in Proxmox
    const proxmoxVM = await proxmoxService.createVM({
      name,
      cores: plan.cpu,
      memory: plan.ram * 1024, // Convert GB to MB
      storage: plan.storage,
      networkSpeed: plan.bandwidth,
    });

    // Create VM record in database
    const vm = await prisma.virtualMachine.create({
      data: {
        name,
        userId,
        planId,
        status: 'PENDING',
        proxmoxVmId: proxmoxVM.vmid,
        proxmoxNode: process.env.PROXMOX_NODE!,
        specs: {
          cpu: plan.cpu,
          ram: plan.ram,
          storage: plan.storage,
          bandwidth: plan.bandwidth,
        },
      },
      include: {
        plan: true,
      },
    });

    // Start the VM
    await proxmoxService.startVM(vm.proxmoxVmId!);

    // Update status to running
    await prisma.virtualMachine.update({
      where: { id: vm.id },
      data: { status: 'RUNNING' },
    });

    res.status(201).json({
      status: 'success',
      data: vm,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error creating VM', 500);
  }
};

export const updateVM = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user!.id;

    const vm = await prisma.virtualMachine.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!vm) {
      throw new AppError('VM not found', 404);
    }

    const updatedVM = await prisma.virtualMachine.update({
      where: { id },
      data: { name },
      include: {
        plan: true,
      },
    });

    res.json({
      status: 'success',
      data: updatedVM,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error updating VM', 500);
  }
};

export const deleteVM = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const vm = await prisma.virtualMachine.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!vm) {
      throw new AppError('VM not found', 404);
    }

    // Delete VM from Proxmox if it exists
    if (vm.proxmoxVmId) {
      try {
        await proxmoxService.deleteVM(vm.proxmoxVmId);
      } catch (error) {
        console.error(`Failed to delete VM ${vm.id} from Proxmox:`, error);
      }
    }

    // Delete VM from database
    await prisma.virtualMachine.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'VM deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error deleting VM', 500);
  }
};

export const controlVM = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user!.id;

    if (!['start', 'stop', 'restart'].includes(action)) {
      throw new AppError('Invalid action', 400);
    }

    const vm = await prisma.virtualMachine.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!vm || !vm.proxmoxVmId) {
      throw new AppError('VM not found', 404);
    }

    switch (action) {
      case 'start':
        await proxmoxService.startVM(vm.proxmoxVmId);
        await prisma.virtualMachine.update({
          where: { id },
          data: { status: 'RUNNING' },
        });
        break;
      case 'stop':
        await proxmoxService.stopVM(vm.proxmoxVmId);
        await prisma.virtualMachine.update({
          where: { id },
          data: { status: 'STOPPED' },
        });
        break;
      case 'restart':
        await proxmoxService.stopVM(vm.proxmoxVmId);
        await proxmoxService.startVM(vm.proxmoxVmId);
        break;
    }

    res.json({
      status: 'success',
      message: `VM ${action}ed successfully`,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(`Error controlling VM: ${error.message}`, 500);
  }
};

export const getVMMetrics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { timeframe = '1h' } = req.query;
    const userId = req.user!.id;

    const vm = await prisma.virtualMachine.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!vm) {
      throw new AppError('VM not found', 404);
    }

    let metrics;
    if (vm.proxmoxVmId) {
      try {
        metrics = await prisma.usageMetric.findMany({
          where: { vmId: id },
          orderBy: { timestamp: 'desc' },
          take: timeframe === '1h' ? 60 : timeframe === '24h' ? 288 : 24,
        });

        // Get current metrics if VM is running
        if (vm.status === 'RUNNING') {
          const currentStats = await proxmoxService.getVMStats(vm.proxmoxVmId);
          metrics = [{ ...currentStats, timestamp: new Date() }, ...metrics];
        }
      } catch (error) {
        console.error(`Failed to fetch metrics for VM ${vm.id}:`, error);
        metrics = [];
      }
    }

    res.json({
      status: 'success',
      data: metrics,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching VM metrics', 500);
  }
};

export const createBackup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const vm = await prisma.virtualMachine.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!vm || !vm.proxmoxVmId) {
      throw new AppError('VM not found', 404);
    }

    const backup = await proxmoxService.createBackup(vm.proxmoxVmId);

    // Create backup record in database
    const backupRecord = await prisma.backup.create({
      data: {
        vmId: id,
        name: `Backup_${new Date().toISOString()}`,
        status: 'COMPLETED',
        size: 0, // Will be updated by background job
        location: backup.volid,
      },
    });

    res.json({
      status: 'success',
      data: backupRecord,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error creating backup', 500);
  }
};