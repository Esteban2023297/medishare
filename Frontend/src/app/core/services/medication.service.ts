import { Injectable, computed, signal } from '@angular/core';
import {
  CatalogItem,
  Donation,
  DonationStatus,
  ImpactMetrics,
  MedicineCategory,
  MedicinePresentation,
  MedicineRequest,
} from '../models/medication.model';

@Injectable({
  providedIn: 'root',
})
export class MedicationService {
  // Lista de principios activos frecuentes para autocompletado inteligente
  public readonly commonActiveIngredients: string[] = [
    'Amoxicilina 500mg',
    'Amoxicilina + Ácido Clavulánico 500/125mg',
    'Azitromicina 500mg',
    'Atorvastatina 20mg',
    'Ciprofloxacino 500mg',
    'Enalapril 10mg',
    'Enalapril 20mg',
    'Ibuprofeno 400mg',
    'Ibuprofeno 600mg',
    'Insulina NPH 100 UI/ml',
    'Loratadina 10mg',
    'Losartán 50mg',
    'Metformina 850mg',
    'Metformina 1000mg',
    'Omeprazol 20mg',
    'Omeprazol 40mg',
    'Paracetamol 500mg',
    'Paracetamol 1g',
    'Salbutamol 100mcg (Aerosol)',
    'Sertralina 50mg',
  ];

  // Métricas de impacto social (ODS 3)
  private readonly _metrics = signal<ImpactMetrics>({
    medicinesSaved: 12480,
    certifiedClinics: 38,
    unitsDistributed: 4210,
    approvalRate: 97,
  });
  public readonly metrics = this._metrics.asReadonly();

  // Catálogo de medicamentos disponibles para clínicas
  private readonly _catalog = signal<CatalogItem[]>([
    {
      id: 'CAT-001',
      activeIngredient: 'Amoxicilina',
      commercialName: 'Amoxil / Genfar',
      presentation: 'Cápsulas',
      category: 'Antibióticos',
      availableUnits: 240,
      minExpirationDate: '2026-11-30',
      isHighDemand: false,
      batchNumber: 'AB-2024-001',
      location: 'Centro de Acopio Norte',
    },
    {
      id: 'CAT-002',
      activeIngredient: 'Metformina',
      commercialName: 'Glucophage 850mg',
      presentation: 'Tabletas',
      category: 'Diabetes',
      availableUnits: 85,
      minExpirationDate: '2027-01-15',
      isHighDemand: true,
      batchNumber: 'MET-850-99',
      location: 'Dispensario Central',
    },
    {
      id: 'CAT-003',
      activeIngredient: 'Enalapril',
      commercialName: 'Renitec 10mg',
      presentation: 'Tabletas',
      category: 'Cardio',
      availableUnits: 160,
      minExpirationDate: '2026-07-20',
      isHighDemand: false,
      batchNumber: 'ENL-10-54',
      location: 'Clínica San Gabriel',
    },
    {
      id: 'CAT-004',
      activeIngredient: 'Omeprazol',
      commercialName: 'Losec 20mg',
      presentation: 'Cápsulas',
      category: 'Gastrointestinal',
      availableUnits: 312,
      minExpirationDate: '2027-05-10',
      isHighDemand: false,
      batchNumber: 'OMP-20-41',
      location: 'Centro de Acopio Norte',
    },
    {
      id: 'CAT-005',
      activeIngredient: 'Paracetamol',
      commercialName: 'Tylenol / Genérico',
      presentation: 'Tabletas',
      category: 'Analgésicos',
      availableUnits: 450,
      minExpirationDate: '2027-08-30',
      isHighDemand: false,
      batchNumber: 'PAR-500-11',
      location: 'Dispensario Central',
    },
    {
      id: 'CAT-006',
      activeIngredient: 'Salbutamol',
      commercialName: 'Ventolin Inhalador 100mcg',
      presentation: 'Inhalador',
      category: 'Respiratorio',
      availableUnits: 42,
      minExpirationDate: '2026-10-15',
      isHighDemand: true,
      batchNumber: 'SLB-100-88',
      location: 'Clínica San Gabriel',
    },
  ]);
  public readonly catalog = this._catalog.asReadonly();

  // Registro de donaciones realizadas por ciudadanos
  private readonly _donations = signal<Donation[]>([
    {
      id: 'DON-001',
      commercialName: 'Amoxil 500mg',
      activeIngredient: 'Amoxicilina',
      category: 'Antibióticos',
      presentation: 'Cápsulas',
      batchNumber: 'AB-2024-001',
      units: 120,
      expirationDate: '2026-11-30',
      status: 'Entregado',
      donorName: 'María Rodríguez',
      donorNotes: 'Empaque original sellado, guardado en lugar seco.',
      targetClinic: 'Clínica Comunitaria Esperanza',
      createdAt: '2026-08-15',
    },
    {
      id: 'DON-002',
      commercialName: 'Glucophage 850mg',
      activeIngredient: 'Metformina',
      category: 'Diabetes',
      presentation: 'Tabletas',
      batchNumber: 'MET-850-99',
      units: 60,
      expirationDate: '2027-01-15',
      status: 'Aprobado',
      donorName: 'María Rodríguez',
      donorNotes: 'Sobrante de tratamiento finalizado.',
      targetClinic: 'Dispensario San José',
      createdAt: '2026-08-28',
    },
    {
      id: 'DON-003',
      commercialName: 'Advil 400mg',
      activeIngredient: 'Ibuprofeno',
      category: 'Analgésicos',
      presentation: 'Tabletas',
      batchNumber: 'IBU-400-22',
      units: 30,
      expirationDate: '2026-12-05',
      status: 'Pendiente',
      donorName: 'María Rodríguez',
      donorNotes: 'Blíster intacto con sello de seguridad.',
      createdAt: '2026-09-02',
    },
    {
      id: 'DON-004',
      commercialName: 'Losec 20mg',
      activeIngredient: 'Omeprazol',
      category: 'Gastrointestinal',
      presentation: 'Cápsulas',
      batchNumber: 'OMP-20-41',
      units: 40,
      expirationDate: '2027-05-10',
      status: 'En revisión',
      donorName: 'María Rodríguez',
      donorNotes: 'Caja con 2 blísters sellados.',
      createdAt: '2026-09-07',
    },
  ]);
  public readonly donations = this._donations.asReadonly();

  // Registro de solicitudes hechas por clínicas comunitarias
  private readonly _requests = signal<MedicineRequest[]>([
    {
      id: 'SOL-101',
      clinicName: 'Clínica Esperanza',
      activeIngredient: 'Amoxicilina',
      presentation: 'Cápsulas',
      requestedUnits: 60,
      requestDate: '2026-09-05',
      urgency: 'Alta',
      status: 'Aprobada',
    },
    {
      id: 'SOL-102',
      clinicName: 'Dispensario Comunitario San José',
      activeIngredient: 'Metformina',
      presentation: 'Tabletas',
      requestedUnits: 40,
      requestDate: '2026-09-06',
      urgency: 'Media',
      status: 'En camino',
    },
    {
      id: 'SOL-103',
      clinicName: 'Asociación Salud Para Todos',
      activeIngredient: 'Salbutamol',
      presentation: 'Inhalador',
      requestedUnits: 15,
      requestDate: '2026-09-08',
      urgency: 'Alta',
      status: 'Pendiente',
    },
  ]);
  public readonly requests = this._requests.asReadonly();

  // Filtros reactivos de búsqueda para el catálogo
  public readonly searchQuery = signal<string>('');
  public readonly selectedCategory = signal<string>('Todos');

  // Catálogo computado con filtros en tiempo real
  public readonly filteredCatalog = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();

    return this._catalog().filter((item) => {
      const matchesCategory =
        category === 'Todos' || item.category === category;
      const matchesSearch =
        !query ||
        item.activeIngredient.toLowerCase().includes(query) ||
        item.commercialName.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  });

  // Métodos de negocio
  public setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  public setSelectedCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  /**
   * Registra una nueva donación garantizando la trazabilidad.
   */
  public registerDonation(
    donationData: Omit<Donation, 'id' | 'createdAt' | 'status'>
  ): Donation {
    const nextIdNumber = this._donations().length + 1;
    const formattedId = `DON-${nextIdNumber.toString().padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newDonation: Donation = {
      ...donationData,
      id: formattedId,
      status: 'Pendiente',
      createdAt: today,
    };

    // Actualizamos lista de donaciones
    this._donations.update((prev) => [newDonation, ...prev]);

    // Actualizamos métricas de impacto
    this._metrics.update((m) => ({
      ...m,
      medicinesSaved: m.medicinesSaved + newDonation.units,
    }));

    return newDonation;
  }

  /**
   * Permite a una clínica solicitar unidades de un fármaco del catálogo.
   */
  public requestMedicine(
    catalogItemId: string,
    clinicName: string,
    units: number,
    urgency: 'Alta' | 'Media' | 'Baja' = 'Media'
  ): { success: boolean; message: string } {
    const item = this._catalog().find((c) => c.id === catalogItemId);
    if (!item) {
      return { success: false, message: 'Fármaco no encontrado en el catálogo.' };
    }

    if (item.availableUnits < units) {
      return {
        success: false,
        message: `Stock insuficiente. Solo hay ${item.availableUnits} unidades disponibles.`,
      };
    }

    // Descontar inventario disponible
    this._catalog.update((prev) =>
      prev.map((c) =>
        c.id === catalogItemId
          ? { ...c, availableUnits: c.availableUnits - units }
          : c
      )
    );

    // Registrar solicitud
    const nextReqNumber = this._requests().length + 101;
    const newRequest: MedicineRequest = {
      id: `SOL-${nextReqNumber}`,
      clinicName,
      activeIngredient: item.activeIngredient,
      presentation: item.presentation,
      requestedUnits: units,
      requestDate: new Date().toISOString().split('T')[0],
      urgency,
      status: 'Aprobada',
    };

    this._requests.update((prev) => [newRequest, ...prev]);

    // Actualizar métricas
    this._metrics.update((m) => ({
      ...m,
      unitsDistributed: m.unitsDistributed + units,
    }));

    return {
      success: true,
      message: `Solicitud de ${units} unidades de ${item.activeIngredient} aprobada para ${clinicName}.`,
    };
  }

  /**
   * Actualiza el estado de una donación (auditoría / trazabilidad).
   */
  public updateDonationStatus(donationId: string, newStatus: DonationStatus): void {
    this._donations.update((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status: newStatus } : d))
    );
  }

  // ==========================================
  // OPERACIONES CRUD DE MEDICAMENTOS (CATÁLOGO)
  // ==========================================
  public createCatalogItem(itemData: Omit<CatalogItem, 'id'>): CatalogItem {
    const nextId = `CAT-${(this._catalog().length + 1).toString().padStart(3, '0')}`;
    const newItem: CatalogItem = {
      ...itemData,
      id: nextId,
    };
    this._catalog.update((prev) => [newItem, ...prev]);
    return newItem;
  }

  public updateCatalogItem(id: string, updatedData: Partial<CatalogItem>): void {
    this._catalog.update((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
  }

  public deleteCatalogItem(id: string): void {
    this._catalog.update((prev) => prev.filter((c) => c.id !== id));
  }

  // ==========================================
  // OPERACIONES CRUD DE DONACIONES (ADMIN)
  // ==========================================
  public updateDonation(id: string, updatedData: Partial<Donation>): void {
    this._donations.update((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updatedData } : d))
    );
  }

  public deleteDonation(id: string): void {
    this._donations.update((prev) => prev.filter((d) => d.id !== id));
  }

  // ==========================================
  // OPERACIONES CRUD DE SOLICITUDES DE CLÍNICAS
  // ==========================================
  public createRequestDirect(requestData: Omit<MedicineRequest, 'id' | 'requestDate'>): MedicineRequest {
    const nextId = `SOL-${(this._requests().length + 101).toString()}`;
    const newReq: MedicineRequest = {
      ...requestData,
      id: nextId,
      requestDate: new Date().toISOString().split('T')[0],
    };
    this._requests.update((prev) => [newReq, ...prev]);
    return newReq;
  }

  public updateRequest(id: string, updatedData: Partial<MedicineRequest>): void {
    this._requests.update((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedData } : r))
    );
  }

  public deleteRequest(id: string): void {
    this._requests.update((prev) => prev.filter((r) => r.id !== id));
  }
}

