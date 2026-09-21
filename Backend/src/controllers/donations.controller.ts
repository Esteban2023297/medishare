import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { MemoryStore } from '../models/store';
import { Donation } from '../models/types';

export function listDonations(req: AuthenticatedRequest, res: Response): void {
  const { status, donorName } = req.query;

  let results = [...MemoryStore.donations];

  if (status && status !== 'Todos') {
    results = results.filter((d) => d.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (donorName) {
    results = results.filter((d) => d.donorName.toLowerCase().includes((donorName as string).toLowerCase()));
  }

  res.json({ count: results.length, donations: results });
}

export function createDonation(req: AuthenticatedRequest, res: Response): void {
  const { commercialName, activeIngredient, category, presentation, batchNumber, units, expirationDate, donorNotes, targetClinic } = req.body;

  if (!commercialName || !activeIngredient || !presentation || !units || !expirationDate) {
    res.status(400).json({ error: 'Campos requeridos incompletos para registrar donación' });
    return;
  }

  const donorName = req.user?.name || req.body.donorName || 'María Rodríguez';
  const nextId = `DON-${(MemoryStore.donations.length + 1).toString().padStart(3, '0')}`;

  const newDonation: Donation = {
    id: nextId,
    commercialName,
    activeIngredient,
    category: category || 'Analgésicos',
    presentation,
    batchNumber: (batchNumber || 'LOT-2026').toUpperCase().trim(),
    units: Number(units),
    expirationDate,
    status: 'Pendiente',
    donorName,
    donorNotes: donorNotes || '',
    targetClinic: targetClinic || undefined,
    createdAt: new Date().toISOString().split('T')[0],
  };

  MemoryStore.donations.unshift(newDonation);
  MemoryStore.metrics.medicinesSaved += Number(units);

  res.status(201).json({
    message: 'Donación aprobada sanitariamente y registrada en MediShare',
    donation: newDonation,
  });
}

export function updateDonation(req: Request, res: Response): void {
  const { id } = req.params;
  const index = MemoryStore.donations.findIndex((d) => d.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Donación no encontrada' });
    return;
  }

  MemoryStore.donations[index] = {
    ...MemoryStore.donations[index],
    ...req.body,
    id,
  };

  res.json({ message: 'Donación actualizada con éxito', donation: MemoryStore.donations[index] });
}

export function deleteDonation(req: Request, res: Response): void {
  const { id } = req.params;
  const index = MemoryStore.donations.findIndex((d) => d.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Donación no encontrada' });
    return;
  }

  const removed = MemoryStore.donations.splice(index, 1)[0];
  res.json({ message: 'Donación eliminada', donation: removed });
}
