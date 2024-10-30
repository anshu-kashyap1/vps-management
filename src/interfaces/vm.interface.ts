import { VirtualMachine, Plan, UsageMetric, Payment, Backup } from '@prisma/client';

export interface ProxmoxStats {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  netIn: number;
  netOut: number;
}

export interface VMSpecs {
  cpu: number;
  ram: number;
  storage: number;
  bandwidth: number;
}

export interface VMCreateParams {
  name: string;
  planId: string;
}

export interface VMWithDetails extends VirtualMachine {
  plan: Plan;
  usageMetrics: UsageMetric[];
  backups?: Backup[];
  payments?: Payment[];
  currentStats?: ProxmoxStats;
}

export interface VMOperationResponse {
  success: boolean;
  vmid?: number;
  message?: string;
}

export type VMStatus = 
  | 'PENDING'
  | 'PROVISIONING'
  | 'RUNNING'
  | 'STOPPED'
  | 'FAILED'
  | 'SUSPENDED'
  | 'TERMINATED';