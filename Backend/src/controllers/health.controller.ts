import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/db';

export async function getHealthStatus(req: Request, res: Response): Promise<void> {
  const dbStatus = await checkDatabaseConnection();

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'MediShare Backend API',
    version: '1.0.0',
    database: {
      engine: 'MySQL',
      connected: dbStatus.connected,
      latencyMs: dbStatus.latencyMs,
      error: dbStatus.error,
    },
  });
}
