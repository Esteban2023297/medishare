import { Request, Response } from 'express';
import { MemoryStore } from '../models/store';
import { MedicineRequest } from '../models/types';

export function listRequests(req: Request, res: Response): void {
  res.json({ count: MemoryStore.requests.length, requests: MemoryStore.requests });
}

export function createRequest(req: Request, res: Response): void {
  const { catalogItemId, clinicName, requestedUnits, urgency } = req.body;

  if (!catalogItemId || !clinicName || !requestedUnits) {
    res.status(400).json({ error: 'Campos incompletos para solicitar medicamentos' });
    return;
  }

  const item = MemoryStore.medicines.find((m) => m.id === catalogItemId);
  if (!item) {
    res.status(404).json({ error: 'Medicamento no encontrado en el inventario' });
    return;
  }

  const units = Number(requestedUnits);
  if (item.availableUnits < units) {
    res.status(422).json({
      error: `Stock insuficiente en dispensario. Solo se dispone de ${item.availableUnits} unidades.`,
    });
    return;
  }

  // Descontar inventario disponible
  item.availableUnits -= units;
  MemoryStore.metrics.unitsDistributed += units;

  const nextId = `SOL-${(MemoryStore.requests.length + 101).toString()}`;
  const newRequest: MedicineRequest = {
    id: nextId,
    clinicName,
    activeIngredient: item.activeIngredient,
    presentation: item.presentation,
    requestedUnits: units,
    requestDate: new Date().toISOString().split('T')[0],
    urgency: urgency || 'Media',
    status: 'Aprobada',
  };

  MemoryStore.requests.unshift(newRequest);

  res.status(201).json({
    message: `Solicitud de ${units} unidades de ${item.activeIngredient} aprobada para ${clinicName}.`,
    request: newRequest,
  });
}

export function updateRequest(req: Request, res: Response): void {
  const { id } = req.params;
  const index = MemoryStore.requests.findIndex((r) => r.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Solicitud clínica no encontrada' });
    return;
  }

  MemoryStore.requests[index] = {
    ...MemoryStore.requests[index],
    ...req.body,
    id,
  };

  res.json({ message: 'Solicitud clínica actualizada', request: MemoryStore.requests[index] });
}

export function deleteRequest(req: Request, res: Response): void {
  const { id } = req.params;
  const index = MemoryStore.requests.findIndex((r) => r.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Solicitud clínica no encontrada' });
    return;
  }

  const removed = MemoryStore.requests.splice(index, 1)[0];
  res.json({ message: 'Solicitud clínica eliminada', request: removed });
}
