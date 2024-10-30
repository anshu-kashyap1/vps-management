import axios from 'axios';
import https from 'https';
import { AppError } from '../middleware/errorHandler';

class ProxmoxService {
  private baseURL: string;
  private ticket: string | null = null;
  private csrf: string | null = null;

  constructor() {
    this.baseURL = `https://${process.env.PROXMOX_HOST}:8006/api2/json`;
  }

  private async authenticate() {
    try {
      const response = await axios.post(
        `${this.baseURL}/access/ticket`,
        new URLSearchParams({
          username: process.env.PROXMOX_USER!,
          password: process.env.PROXMOX_PASSWORD!,
        }),
        {
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
          }),
        }
      );

      this.ticket = response.data.data.ticket;
      this.csrf = response.data.data.CSRFPreventionToken;
    } catch (error) {
      throw new AppError('Failed to authenticate with Proxmox', 500);
    }
  }

  private async request(method: string, path: string, data?: any) {
    if (!this.ticket) {
      await this.authenticate();
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${path}`,
        headers: {
          'Cookie': `PVEAuthCookie=${this.ticket}`,
          ...(method !== 'GET' ? { 'CSRFPreventionToken': this.csrf } : {}),
        },
        data,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        this.ticket = null;
        this.csrf = null;
        throw new AppError('Proxmox authentication expired', 401);
      }
      throw new AppError('Proxmox API request failed', 500);
    }
  }

  async createVM(params: {
    node: string;
    vmid: number;
    name: string;
    cores: number;
    memory: number;
    storage: number;
  }) {
    const { node, vmid, name, cores, memory, storage } = params;

    try {
      // Create VM
      await this.request('POST', `/nodes/${node}/qemu`, {
        vmid,
        name,
        cores,
        memory,
        storage: `local-lvm:${storage}`,
        ostype: 'l26', // Linux 2.6+ kernel
        net0: 'virtio,bridge=vmbr0',
      });

      return { success: true, vmid };
    } catch (error) {
      throw new AppError('Failed to create VM in Proxmox', 500);
    }
  }

  async startVM(node: string, vmid: number) {
    try {
      await this.request('POST', `/nodes/${node}/qemu/${vmid}/status/start`);
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to start VM', 500);
    }
  }

  async stopVM(node: string, vmid: number) {
    try {
      await this.request('POST', `/nodes/${node}/qemu/${vmid}/status/stop`);
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to stop VM', 500);
    }
  }

  async deleteVM(node: string, vmid: number) {
    try {
      await this.request('DELETE', `/nodes/${node}/qemu/${vmid}`);
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to delete VM', 500);
    }
  }

  async getVMStatus(node: string, vmid: number) {
    try {
      const status = await this.request('GET', `/nodes/${node}/qemu/${vmid}/status/current`);
      return status;
    } catch (error) {
      throw new AppError('Failed to get VM status', 500);
    }
  }

  async getVMStats(node: string, vmid: number) {
    try {
      const stats = await this.request('GET', `/nodes/${node}/qemu/${vmid}/status/current`);
      return {
        cpuUsage: stats.cpu * 100,
        memoryUsage: (stats.mem / stats.maxmem) * 100,
        diskUsage: stats.disk * 100,
        netIn: stats.netin,
        netOut: stats.netout,
      };
    } catch (error) {
      throw new AppError('Failed to get VM statistics', 500);
    }
  }

  async createSnapshot(node: string, vmid: number, name: string) {
    try {
      await this.request('POST', `/nodes/${node}/qemu/${vmid}/snapshot`, {
        snapname: name,
      });
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to create snapshot', 500);
    }
  }

  async restoreSnapshot(node: string, vmid: number, name: string) {
    try {
      await this.request('POST', `/nodes/${node}/qemu/${vmid}/snapshot/${name}/rollback`);
      return { success: true };
    } catch (error) {
      throw new AppError('Failed to restore snapshot', 500);
    }
  }
}

export const proxmoxService = new ProxmoxService();