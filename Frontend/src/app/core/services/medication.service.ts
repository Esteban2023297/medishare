import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
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
  private readonly apiService = inject(ApiService);

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
    approvalRate: 98,
  });
  public readonly metrics = this._metrics.asReadonly();

  // Catálogo de medicamentos disponibles para clínicas
  private readonly _catalog = signal<CatalogItem[]>([]);
  public readonly catalog = this._catalog.asReadonly();

  // Registro de donaciones realizadas por ciudadanos
  private readonly _donations = signal<Donation[]>([]);
  public readonly donations = this._donations.asReadonly();

  // Registro de solicitudes hechas por clínicas comunitarias
  private readonly _requests = signal<MedicineRequest[]>([]);
  public readonly requests = this._requests.asReadonly();

  // Filtros reactivos de búsqueda para el catálogo
  public readonly searchQuery = signal<string>('');
  public readonly selectedCategory = signal<string>('Todos');

  // Catálogo computado con filtros en tiempo real
  public readonly filteredCatalog = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const category = this.selectedCategory();
    const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const catNorm = norm(category);

    return this._catalog().filter((item) => {
      const matchesCategory =
        category === 'Todos' ||
        norm(item.category) === catNorm ||
        (catNorm.length >= 4 && norm(item.category).includes(catNorm.slice(0, 5)));
      const matchesSearch =
        !query ||
        norm(item.activeIngredient).includes(norm(query)) ||
        norm(item.commercialName).includes(norm(query));

      return matchesCategory && matchesSearch;
    });
  });

  constructor() {
    this.loadAll();
  }

  /**
   * Carga todos los datos reales desde la base de datos MySQL a través de la API
   */
  public loadAll(): void {
    this.apiService.get<{ medicines: CatalogItem[] }>('/medicines').subscribe({
      next: (res) => {
        if (res?.medicines) {
          this._catalog.set(res.medicines);
        }
      },
      error: (err) => console.warn('Error cargando medicamentos desde MySQL:', err),
    });

    this.apiService.get<{ donations: Donation[] }>('/donations').subscribe({
      next: (res) => {
        if (res?.donations) {
          this._donations.set(res.donations);
        }
      },
      error: (err) => console.warn('Error cargando donaciones desde MySQL:', err),
    });

    this.apiService.get<{ requests: MedicineRequest[] }>('/requests').subscribe({
      next: (res) => {
        if (res?.requests) {
          this._requests.set(res.requests);
        }
      },
      error: (err) => console.warn('Error cargando solicitudes desde MySQL:', err),
    });

    this.apiService.get<{ metrics: ImpactMetrics }>('/metrics').subscribe({
      next: (res) => {
        if (res?.metrics) {
          this._metrics.set(res.metrics);
        }
      },
      error: (err) => console.warn('Error cargando métricas desde MySQL:', err),
    });
  }

  // Métodos de filtros
  public setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  public setSelectedCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  /**
   * Registra una nueva donación garantizando trazabilidad y persistencia en MySQL
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

    // Actualización reactiva inmediata
    this._donations.update((prev) => [newDonation, ...prev]);
    this._metrics.update((m) => ({
      ...m,
      medicinesSaved: m.medicinesSaved + newDonation.units,
    }));

    // Persistencia HTTP en MySQL
    this.apiService.post<{ donation: Donation }>('/donations', donationData).subscribe({
      next: (res) => {
        if (res?.donation) {
          this._donations.update((prev) =>
            prev.map((d) => (d.id === formattedId ? res.donation : d))
          );
        }
      },
      error: (err) => console.error('Error al persistir donación en MySQL:', err),
    });

    return newDonation;
  }

  /**
   * Permite a una clínica solicitar unidades de un fármaco del catálogo
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
    this._metrics.update((m) => ({
      ...m,
      unitsDistributed: m.unitsDistributed + units,
    }));

    // Persistencia HTTP en MySQL
    this.apiService.post<{ request: MedicineRequest }>('/requests', {
      catalogItemId,
      clinicName,
      requestedUnits: units,
      urgency,
      activeIngredient: item.activeIngredient,
      presentation: item.presentation,
    }).subscribe({
      next: (res) => {
        if (res?.request) {
          this._requests.update((prev) =>
            prev.map((r) => (r.id === newRequest.id ? res.request : r))
          );
        }
      },
      error: (err) => console.error('Error persistiendo solicitud clínica en MySQL:', err),
    });

    return {
      success: true,
      message: `Solicitud de ${units} unidades de ${item.activeIngredient} aprobada para ${clinicName}.`,
    };
  }

  public updateDonationStatus(donationId: string, newStatus: DonationStatus): void {
    this._donations.update((prev) =>
      prev.map((d) => (d.id === donationId ? { ...d, status: newStatus } : d))
    );

    this.apiService.put(`/donations/${donationId}`, { status: newStatus }).subscribe({
      error: (err) => console.error('Error al actualizar estado de donación en MySQL:', err),
    });
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

    this.apiService.post<{ medicine: CatalogItem }>('/medicines', itemData).subscribe({
      next: (res) => {
        if (res?.medicine) {
          this._catalog.update((prev) =>
            prev.map((m) => (m.id === nextId ? res.medicine : m))
          );
        }
      },
      error: (err) => console.error('Error guardando medicamento en MySQL:', err),
    });

    return newItem;
  }

  public updateCatalogItem(id: string, updatedData: Partial<CatalogItem>): void {
    this._catalog.update((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );

    this.apiService.put(`/medicines/${id}`, updatedData).subscribe({
      error: (err) => console.error('Error actualizando medicamento en MySQL:', err),
    });
  }

  public deleteCatalogItem(id: string): void {
    this._catalog.update((prev) => prev.filter((c) => c.id !== id));

    this.apiService.delete(`/medicines/${id}`).subscribe({
      error: (err) => console.error('Error eliminando medicamento en MySQL:', err),
    });
  }

  // ==========================================
  // OPERACIONES CRUD DE DONACIONES (ADMIN)
  // ==========================================
  public createDonationDirect(donationData: Omit<Donation, 'id' | 'createdAt'>): Donation {
    const nextId = `DON-${(this._donations().length + 1).toString().padStart(3, '0')}`;
    const newDon: Donation = {
      ...donationData,
      id: nextId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this._donations.update((prev) => [newDon, ...prev]);

    this.apiService.post<{ donation: Donation }>('/donations', donationData).subscribe({
      next: (res) => {
        if (res?.donation) {
          this._donations.update((prev) =>
            prev.map((d) => (d.id === nextId ? res.donation : d))
          );
        }
      },
      error: (err) => console.error('Error guardando donación en MySQL:', err),
    });

    return newDon;
  }

  public updateDonation(id: string, updatedData: Partial<Donation>): void {
    this._donations.update((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updatedData } : d))
    );

    this.apiService.put(`/donations/${id}`, updatedData).subscribe({
      error: (err) => console.error('Error actualizando donación en MySQL:', err),
    });
  }

  public deleteDonation(id: string): void {
    this._donations.update((prev) => prev.filter((d) => d.id !== id));

    this.apiService.delete(`/donations/${id}`).subscribe({
      error: (err) => console.error('Error eliminando donación en MySQL:', err),
    });
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

    this.apiService.post<{ request: MedicineRequest }>('/requests', requestData).subscribe({
      next: (res) => {
        if (res?.request) {
          this._requests.update((prev) =>
            prev.map((r) => (r.id === nextId ? res.request : r))
          );
        }
      },
      error: (err) => console.error('Error guardando solicitud en MySQL:', err),
    });

    return newReq;
  }

  public updateRequest(id: string, updatedData: Partial<MedicineRequest>): void {
    this._requests.update((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedData } : r))
    );

    this.apiService.put(`/requests/${id}`, updatedData).subscribe({
      error: (err) => console.error('Error actualizando solicitud en MySQL:', err),
    });
  }

  public deleteRequest(id: string): void {
    this._requests.update((prev) => prev.filter((r) => r.id !== id));

    this.apiService.delete(`/requests/${id}`).subscribe({
      error: (err) => console.error('Error eliminando solicitud en MySQL:', err),
    });
  }
}
