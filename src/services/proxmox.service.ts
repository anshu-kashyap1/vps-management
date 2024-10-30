// src/services/proxmox.service.ts

import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { AppError } from '../middleware/errorHandler';

interface ProxmoxConfig {
  host: string;
  user: string;
  password: string;
  port?: number;
  node?: string;
}

interface VMCreateOptions {
  name: string;
  cores: number;
  memory: number;
  storage: number;
  template?: string;
  networkSpeed?: number;
}

class ProxmoxService {
  private api: AxiosInstance;
  private ticket: string | null = null;
  private csrf: string | null = null;
  private readonly config: ProxmoxConfig;

  constructor() {
    this.config = {
      host: process.env.PROXMOX_HOST!,
      user: process.env.PROXMOX_USER!,
      password: process.env.PROXMOX_PASSWORD!,
      port: parseInt(process.env.PROXMOX_PORT || '8006'),
      node: process.env.PROXMOX_NODE || 'pve',
    };

    this.api = axios.create({
      baseURL: `https://${this.config.host}:${this.config.port}/api2/json`,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  private async authenticate() {
    try {
      const response = await this.api.post('/access/ticket', new URLSearchParams({
        username: this.config.user,
        password: this.config.password,
      }));

      this.ticket = response.data.data.ticket;
      this.csrf = response.data.data.CSRFPreventionToken;

      this.api.defaults.headers.common.Cookie = `PVEAuthCookie=${this.ticket}`;
      this.api.defaults.headers.common.CSRFPreventionToken = this.csrf;
    } catch (error) {
      throw new AppError('Proxmox authentication failed', 500);
    }
  }

  private async ensureAuthenticated() {
    if (!this.ticket || !this.csrf) {
      await this.authenticate();
    }
  }

  async getNextVMID(): Promise<number> {
    await this.ensureAuthenticated();
    try {
      const response = await this.api.get('/cluster/nextid');
      return response.data.data;
    } catch (error) {
      throw new AppError('Failed to get next VMID', 500);
    }
  }

  async createVM(options: VMCreateOptions) {
    await this.ensureAuthenticated();
    try {
      const vmid = await this.getNextVMID();
      const node = this.config.node;

      const response = await this.api.post(`/nodes/${node}/qemu`, {
        vmid,
        name: options.name,
        cores: options.cores,
        memory: options.memory,
        storage: `local-lvm:${options.storage}`,
        net0: 'virtio,bridge=vmbr0',
        ostype: 'l26',
        ...(options.template && { clone: options.template }),
      });

      if (options.networkSpeed) {
        await this.setNetworkLimit(vmid, options.networkSpeed);
      }

      return {
        vmid,
        name: options.name,
        status: 'created',
      };
    } catch (error) {
      throw new AppError('Failed to create VM', 500);
    }
  }

  async startVM(vmid: number) {
    await this.ensureAuthenticated();
    try {
      await this.api.post(`/nodes/${this.config.node}/qemu/${vmid}/status/start`);
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to start VM', 500);
    }
  }

  async stopVM(vmid: number) {
    await this.ensureAuthenticated();
    try {
      await this.api.post(`/nodes/${this.config.node}/qemu/${vmid}/status/stop`);
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to stop VM', 500);
    }
  }

  async getVMStatus(vmid: number) {
    await this.ensureAuthenticated();
    try {
      const response = await this.api.get(
        `/nodes/${this.config.node}/qemu/${vmid}/status/current`
      );
      return response.data.data;
    } catch (error) {
      throw new AppError('Failed to get VM status', 500);
    }
  }

  async getVMStats(vmid: number) {
    await this.ensureAuthenticated();
    try {
      const response = await this.api.get(
        `/nodes/${this.config.node}/qemu/${vmid}/rrddata`
      );
      const data = response.data.data;
      return {
        cpu: data.cpu,
        memory: (data.mem / data.maxmem) * 100,
        disk: (data.disk / data.maxdisk) * 100,
        networkIn: data.netin,
        networkOut: data.netout,
      };
    } catch (error) {
      throw new AppError('Failed to get VM statistics', 500);
    }
  }

  async setNetworkLimit(vmid: number, speedMbps: number) {
    await this.ensureAuthenticated();
    try {
      await this.api.put(
        `/nodes/${this.config.node}/qemu/${vmid}/config`,
        {
          net0: `virtio,bridge=vmbr0,rate=${speedMbps}`,
        }
      );
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to set network limit', 500);
    }
  }

  async deleteVM(vmid: number) {
    await this.ensureAuthenticated();
    try {
      await this.api.delete(
        `/nodes/${this.config.node}/qemu/${vmid}`
      );
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to delete VM', 500);
    }
  }

  async createBackup(vmid: number) {
    await this.ensureAuthenticated();
    try {
      const response = await this.api.post(
        `/nodes/${this.config.node}/qemu/${vmid}/snapshot`,
        {
          snapname: `backup_${Date.now()}`,
        }
      );
      return response.data.data;
    } catch (error) {
      throw new AppError('Failed to create backup', 500);
    }
  }
}

export const proxmoxService = new ProxmoxService();