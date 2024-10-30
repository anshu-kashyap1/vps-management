import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { proxmoxService } from '../services/proxmox.service';
import { AppError } from '../middleware/errorHandler';

export const getNodes = async (_req: AuthRequest, res: Response) => {
  try {
    const nodes = await proxmoxService.getNodes();
    res.json({
      status: 'success',
      data: nodes,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching nodes', 500);
  }
};

export const getNodeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { node } = req.params;
    const status = await proxmoxService.getNodeStatus(node);
    res.json({
      status: 'success',
      data: status,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching node status', 500);
  }
};

export const getNodeResources = async (req: AuthRequest, res: Response) => {
  try {
    const { node } = req.params;
    const resources = await proxmoxService.getNodeResources(node);
    res.json({
      status: 'success',
      data: resources,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching node resources', 500);
  }
};

export const getAllVMs = async (_req: AuthRequest, res: Response) => {
  try {
    const vms = await proxmoxService.getAllVMs();
    res.json({
      status: 'success',
      data: vms,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching VMs', 500);
  }
};

export const getTemplates = async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await proxmoxService.getTemplates();
    res.json({
      status: 'success',
      data: templates,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching templates', 500);
  }
};

export const getVMMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const { node, vmid } = req.params;
    const { timeframe = 'hour' } = req.query;

    const metrics = await proxmoxService.getVMRRDData(
      node, 
      Number(vmid), 
      timeframe as 'hour' | 'day' | 'week' | 'month' | 'year'
    );

    res.json({
      status: 'success',
      data: metrics,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error fetching VM metrics', 500);
  }
};