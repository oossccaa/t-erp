import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getInfo(): object {
    return {
      name: 'T-ERP Backend API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    }
  }
}