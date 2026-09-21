import { Request, Response } from 'express';
import { MemoryStore } from '../models/store';

export function getMetrics(req: Request, res: Response): void {
  res.json({
    metrics: MemoryStore.metrics,
    summary: {
      totalMedicinesInCatalog: MemoryStore.medicines.length,
      totalDonations: MemoryStore.donations.length,
      totalRequests: MemoryStore.requests.length,
      totalUsers: MemoryStore.users.length,
    },
  });
}
