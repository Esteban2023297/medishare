import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { MedicationService } from './medication.service';

describe('Servicio de Negocio MediShare: MedicationService', () => {
  let service: MedicationService;

  beforeEach(() => {
    service = new MedicationService();
  });

  it('debe inicializar con inventario base y métricas comunitarias del ODS 3', () => {
    expect(service.catalog().length).toBeGreaterThan(0);
    expect(service.metrics().medicinesSaved).toBe(12480);
    expect(service.metrics().certifiedClinics).toBe(38);
  });

  it('debe registrar una donación y actualizar el contador de unidades salvadas', () => {
    const prevSaved = service.metrics().medicinesSaved;
    const initialDonationsCount = service.donations().length;

    const donation = service.registerDonation({
      commercialName: 'Tylenol 500mg',
      activeIngredient: 'Paracetamol',
      category: 'Analgésicos',
      presentation: 'Tabletas',
      batchNumber: 'TYL-2026-09',
      units: 50,
      expirationDate: '2027-04-10',
      donorName: 'María Rodríguez',
      donorNotes: 'Empaque íntegro',
    });

    expect(donation.id).toBe(`DON-${(initialDonationsCount + 1).toString().padStart(3, '0')}`);
    expect(donation.status).toBe('Pendiente');
    expect(service.donations().length).toBe(initialDonationsCount + 1);
    expect(service.metrics().medicinesSaved).toBe(prevSaved + 50);
  });

  it('debe descontar inventario y registrar una orden cuando una clínica solicita medicamentos', () => {
    const item = service.catalog()[0]; // Amoxicilina 240 unidades
    const initialUnits = item.availableUnits;
    const initialDistributed = service.metrics().unitsDistributed;

    const result = service.requestMedicine(item.id, 'Clínica Comunitaria Esperanza', 40, 'Alta');

    expect(result.success).toBe(true);
    const updatedItem = service.catalog().find((c) => c.id === item.id);
    expect(updatedItem?.availableUnits).toBe(initialUnits - 40);
    expect(service.metrics().unitsDistributed).toBe(initialDistributed + 40);
  });

  it('debe rechazar solicitudes clínicas que superen el stock disponible', () => {
    const item = service.catalog()[0];
    const result = service.requestMedicine(item.id, 'Clínica Esperanza', 99999, 'Alta');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Stock insuficiente');
  });

  it('debe filtrar en tiempo real por categoría y principio activo mediante Signals reactivos', () => {
    service.setSelectedCategory('Diabetes');
    expect(service.filteredCatalog().every((c) => c.category === 'Diabetes')).toBe(true);

    service.setSelectedCategory('Todos');
    service.setSearchQuery('Amox');
    expect(service.filteredCatalog().some((c) => c.activeIngredient.includes('Amoxicilina'))).toBe(true);
  });
});
