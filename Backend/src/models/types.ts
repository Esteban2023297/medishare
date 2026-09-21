export type UserRole = 'admin' | 'usuario';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  status: 'Activo' | 'Inactivo' | 'Suspendido';
  createdAt: string;
}

export type MedicineCategory =
  | 'Todos'
  | 'Antibióticos'
  | 'Diabetes'
  | 'Cardio'
  | 'Analgésicos'
  | 'Respiratorio'
  | 'Gastrointestinal'
  | 'Otros';

export type MedicinePresentation =
  | 'Tabletas'
  | 'Cápsulas'
  | 'Jarabe'
  | 'Gotas'
  | 'Inyectable'
  | 'Inhalador'
  | 'Pomada / Gel';

export type DonationStatus =
  | 'Pendiente'
  | 'Aprobado'
  | 'Entregado'
  | 'En revisión'
  | 'Rechazado';

export type RequestStatus =
  | 'Pendiente'
  | 'Aprobada'
  | 'En camino'
  | 'Entregada';

export interface MedicineCatalogItem {
  id: string;
  activeIngredient: string;
  commercialName: string;
  presentation: MedicinePresentation;
  category: MedicineCategory;
  availableUnits: number;
  minExpirationDate: string; // YYYY-MM-DD
  isHighDemand: boolean;
  batchNumber: string;
  location?: string;
}

export interface Donation {
  id: string;
  commercialName: string;
  activeIngredient: string;
  category: MedicineCategory;
  presentation: MedicinePresentation;
  batchNumber: string;
  units: number;
  expirationDate: string; // YYYY-MM-DD
  status: DonationStatus;
  donorName: string;
  donorNotes?: string;
  targetClinic?: string;
  createdAt: string;
}

export interface MedicineRequest {
  id: string;
  clinicName: string;
  activeIngredient: string;
  presentation: MedicinePresentation;
  requestedUnits: number;
  requestDate: string;
  urgency: 'Alta' | 'Media' | 'Baja';
  status: RequestStatus;
}

export interface ImpactMetrics {
  medicinesSaved: number;
  certifiedClinics: number;
  unitsDistributed: number;
  approvalRate: number;
}
