import { Request, Response } from 'express';
import { MemoryStore } from '../models/store';
import { MedicineCatalogItem } from '../models/types';

export function listMedicines(req: Request, res: Response): void {
  const { q, category } = req.query;

  let results = [...MemoryStore.medicines];

  if (category && category !== 'Todos') {
    results = results.filter((m) => m.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (q) {
    const query = (q as string).toLowerCase().trim();
    results = results.filter(
      (m) =>
        m.activeIngredient.toLowerCase().includes(query) ||
        m.commercialName.toLowerCase().includes(query) ||
        m.batchNumber.toLowerCase().includes(query)
    );
  }

  res.json({ count: results.length, medicines: results });
}

export function getMedicineById(req: Request, res: Response): void {
  const { id } = req.params;
  const medicine = MemoryStore.medicines.find((m) => m.id === id);

  if (!medicine) {
    res.status(404).json({ error: 'Medicamento no encontrado en el catálogo' });
    return;
  }

  res.json({ medicine });
}

export function createMedicine(req: Request, res: Response): void {
  const { activeIngredient, commercialName, presentation, category, availableUnits, minExpirationDate, batchNumber, isHighDemand } = req.body;

  if (!activeIngredient || !commercialName || !presentation || !category) {
    res.status(400).json({ error: 'Campos requeridos incompletos para crear medicamento' });
    return;
  }

  const nextId = `CAT-${(MemoryStore.medicines.length + 1).toString().padStart(3, '0')}`;
  const newMedicine: MedicineCatalogItem = {
    id: nextId,
    activeIngredient,
    commercialName,
    presentation,
    category,
    availableUnits: Number(availableUnits) || 0,
    minExpirationDate: minExpirationDate || '2027-01-01',
    batchNumber: batchNumber || `LOT-${Math.floor(Math.random() * 900 + 100)}`,
    isHighDemand: Boolean(isHighDemand),
    location: 'Centro de Acopio Central',
  };

  MemoryStore.medicines.unshift(newMedicine);
  res.status(201).json({ message: 'Medicamento agregado al catálogo', medicine: newMedicine });
}

export function updateMedicine(req: Request, res: Response): void {
  const { id } = req.params;
  const index = MemoryStore.medicines.findIndex((m) => m.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Medicamento no encontrado' });
    return;
  }

  MemoryStore.medicines[index] = {
    ...MemoryStore.medicines[index],
    ...req.body,
    id, // Mantener inmutable el ID
  };

  res.json({ message: 'Medicamento actualizado con éxito', medicine: MemoryStore.medicines[index] });
}

export function deleteMedicine(req: Request, res: Response): void {
  const { id } = req.params;
  const index = MemoryStore.medicines.findIndex((m) => m.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Medicamento no encontrado' });
    return;
  }

  const removed = MemoryStore.medicines.splice(index, 1)[0];
  res.json({ message: 'Medicamento eliminado del catálogo', medicine: removed });
}
