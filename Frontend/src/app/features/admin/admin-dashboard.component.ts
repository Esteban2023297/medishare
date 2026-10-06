import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  CatalogItem,
  Donation,
  DonationStatus,
  MedicineCategory,
  MedicinePresentation,
  MedicineRequest,
  RequestStatus,
} from '../../core/models/medication.model';
import { User, UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { MedicationService } from '../../core/services/medication.service';
import { SqlDatabaseService } from '../../core/services/sql-database.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  private readonly medicationService = inject(MedicationService);
  private readonly authService = inject(AuthService);
  public readonly sqlService = inject(SqlDatabaseService);

  public readonly activeTab = signal<'medicamentos' | 'donaciones' | 'solicitudes' | 'usuarios' | 'sql'>('medicamentos');

  public readonly catalog = this.medicationService.catalog;
  public readonly donations = this.medicationService.donations;
  public readonly requests = this.medicationService.requests;
  public readonly users = this.authService.users;

  // 1. Estado modales - MEDICAMENTOS
  public showMedicineModal = signal<boolean>(false);
  public isEditingMedicine = signal<boolean>(false);
  public editingMedicineId = signal<string | null>(null);
  public medForm = {
    activeIngredient: '',
    commercialName: '',
    presentation: 'Tabletas' as MedicinePresentation,
    category: 'Analgésicos' as MedicineCategory,
    availableUnits: 100,
    batchNumber: 'LOT-2026',
    minExpirationDate: '2027-06-30',
    isHighDemand: false,
  };

  // 2. Estado modales - DONACIONES
  public showDonationModal = signal<boolean>(false);
  public isEditingDonation = signal<boolean>(false);
  public editingDonationId = signal<string | null>(null);
  public donationForm = {
    commercialName: '',
    activeIngredient: '',
    presentation: 'Tabletas' as MedicinePresentation,
    category: 'Analgésicos' as MedicineCategory,
    units: 30,
    batchNumber: 'LOT-2026',
    expirationDate: '2027-06-30',
    status: 'Pendiente' as DonationStatus,
    donorName: 'María Rodríguez',
    donorNotes: '',
    targetClinic: '',
  };

  // 3. Estado modales - SOLICITUDES CLÍNICAS
  public showRequestModal = signal<boolean>(false);
  public isEditingRequest = signal<boolean>(false);
  public editingRequestId = signal<string | null>(null);
  public requestForm = {
    clinicName: '',
    activeIngredient: '',
    presentation: 'Tabletas' as MedicinePresentation,
    requestedUnits: 25,
    urgency: 'Media' as 'Alta' | 'Media' | 'Baja',
    status: 'Pendiente' as RequestStatus,
  };

  // 4. Estado modales - USUARIOS
  public showUserModal = signal<boolean>(false);
  public isEditingUser = signal<boolean>(false);
  public editingUserId = signal<string | null>(null);
  public userForm = {
    name: '',
    email: '',
    password: '',
    role: 'usuario' as UserRole,
    institution: '',
    status: 'Activo' as 'Activo' | 'Inactivo' | 'Pendiente',
  };

  // SQL test feedback
  public isTestingSql = signal<boolean>(false);
  public sqlTestResult = signal<string | null>(null);

  // ==========================================
  // CRUD MEDICAMENTOS
  // ==========================================
  public openNewMedicineModal(): void {
    this.isEditingMedicine.set(false);
    this.editingMedicineId.set(null);
    this.medForm = {
      activeIngredient: '',
      commercialName: '',
      presentation: 'Tabletas',
      category: 'Analgésicos',
      availableUnits: 100,
      batchNumber: `LOT-${Math.floor(Math.random() * 900 + 100)}`,
      minExpirationDate: '2027-06-30',
      isHighDemand: false,
    };
    this.showMedicineModal.set(true);
  }

  public editMedicine(med: CatalogItem): void {
    this.isEditingMedicine.set(true);
    this.editingMedicineId.set(med.id);
    this.medForm = { ...med };
    this.showMedicineModal.set(true);
  }

  public saveMedicine(): void {
    if (!this.medForm.activeIngredient || !this.medForm.commercialName) return;

    if (this.isEditingMedicine() && this.editingMedicineId()) {
      this.medicationService.updateCatalogItem(this.editingMedicineId()!, this.medForm);
    } else {
      this.medicationService.createCatalogItem(this.medForm);
    }
    this.showMedicineModal.set(false);
  }

  public deleteMedicine(id: string): void {
    if (confirm('¿Confirmas eliminar este medicamento del catálogo?')) {
      this.medicationService.deleteCatalogItem(id);
    }
  }

  // ==========================================
  // CRUD DONACIONES
  // ==========================================
  public openNewDonationModal(): void {
    this.isEditingDonation.set(false);
    this.editingDonationId.set(null);
    this.donationForm = {
      commercialName: '',
      activeIngredient: '',
      presentation: 'Tabletas',
      category: 'Analgésicos',
      units: 30,
      batchNumber: `LOT-${Math.floor(Math.random() * 900 + 100)}`,
      expirationDate: '2027-06-30',
      status: 'Pendiente',
      donorName: 'María Rodríguez',
      donorNotes: '',
      targetClinic: '',
    };
    this.showDonationModal.set(true);
  }

  public editDonation(don: Donation): void {
    this.isEditingDonation.set(true);
    this.editingDonationId.set(don.id);
    this.donationForm = {
      commercialName: don.commercialName,
      activeIngredient: don.activeIngredient,
      presentation: don.presentation,
      category: don.category,
      units: don.units,
      batchNumber: don.batchNumber,
      expirationDate: don.expirationDate,
      status: don.status,
      donorName: don.donorName,
      donorNotes: don.donorNotes || '',
      targetClinic: don.targetClinic || '',
    };
    this.showDonationModal.set(true);
  }

  public saveDonation(): void {
    if (!this.donationForm.commercialName || !this.donationForm.activeIngredient) return;

    if (this.isEditingDonation() && this.editingDonationId()) {
      this.medicationService.updateDonation(this.editingDonationId()!, this.donationForm);
    } else {
      this.medicationService.createDonationDirect(this.donationForm);
    }
    this.showDonationModal.set(false);
  }

  public changeDonationStatus(id: string, status: DonationStatus): void {
    this.medicationService.updateDonationStatus(id, status);
  }

  public onClinicAssign(id: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value.trim();
    this.medicationService.updateDonation(id, { targetClinic: val });
  }

  public deleteDonation(id: string): void {
    if (confirm('¿Deseas eliminar este registro de donación?')) {
      this.medicationService.deleteDonation(id);
    }
  }

  // ==========================================
  // CRUD SOLICITUDES CLÍNICAS
  // ==========================================
  public openNewRequestModal(): void {
    this.isEditingRequest.set(false);
    this.editingRequestId.set(null);
    this.requestForm = {
      clinicName: '',
      activeIngredient: '',
      presentation: 'Tabletas',
      requestedUnits: 25,
      urgency: 'Media',
      status: 'Pendiente',
    };
    this.showRequestModal.set(true);
  }

  public editRequest(req: MedicineRequest): void {
    this.isEditingRequest.set(true);
    this.editingRequestId.set(req.id);
    this.requestForm = {
      clinicName: req.clinicName,
      activeIngredient: req.activeIngredient,
      presentation: req.presentation,
      requestedUnits: req.requestedUnits,
      urgency: req.urgency,
      status: req.status,
    };
    this.showRequestModal.set(true);
  }

  public saveRequest(): void {
    if (!this.requestForm.clinicName || !this.requestForm.activeIngredient) return;

    if (this.isEditingRequest() && this.editingRequestId()) {
      this.medicationService.updateRequest(this.editingRequestId()!, this.requestForm);
    } else {
      this.medicationService.createRequestDirect(this.requestForm);
    }
    this.showRequestModal.set(false);
  }

  public changeRequestStatus(id: string, status: RequestStatus): void {
    this.medicationService.updateRequest(id, { status });
  }

  public deleteRequest(id: string): void {
    if (confirm('¿Deseas cancelar esta orden clínica?')) {
      this.medicationService.deleteRequest(id);
    }
  }

  // ==========================================
  // CRUD USUARIOS
  // ==========================================
  public openNewUserModal(): void {
    this.isEditingUser.set(false);
    this.editingUserId.set(null);
    this.userForm = {
      name: '',
      email: '',
      password: '',
      role: 'usuario',
      institution: '',
      status: 'Activo',
    };
    this.showUserModal.set(true);
  }

  public editUser(user: User): void {
    this.isEditingUser.set(true);
    this.editingUserId.set(user.id);
    this.userForm = {
      name: user.name,
      email: user.email,
      password: '', // Vacía al inicio; si se ingresa, se actualizará
      role: user.role,
      institution: user.institution || '',
      status: user.status,
    };
    this.showUserModal.set(true);
  }

  public saveUser(): void {
    if (!this.userForm.name || !this.userForm.email) return;

    if (this.isEditingUser() && this.editingUserId()) {
      const updatePayload: any = {
        name: this.userForm.name,
        email: this.userForm.email,
        role: this.userForm.role,
        institution: this.userForm.institution,
        status: this.userForm.status,
      };
      if (this.userForm.password && this.userForm.password.trim()) {
        updatePayload.password = this.userForm.password.trim();
      }
      this.authService.updateUser(this.editingUserId()!, updatePayload);
    } else {
      if (!this.userForm.password || !this.userForm.password.trim()) {
        alert('Por favor introduce una contraseña para crear el usuario.');
        return;
      }
      this.authService.createUserByAdmin(this.userForm);
    }
    this.showUserModal.set(false);
  }

  public toggleUserRole(user: User): void {
    const newRole: UserRole = user.role === 'admin' ? 'usuario' : 'admin';
    this.authService.updateUser(user.id, { role: newRole });
  }

  public deleteUser(id: string): void {
    if (confirm('¿Deseas eliminar este usuario?')) {
      this.authService.deleteUser(id);
    }
  }

  // ==========================================
  // Operaciones SQL y Navegación
  // ==========================================
  public async testSqlConnection(): Promise<void> {
    this.isTestingSql.set(true);
    this.sqlTestResult.set(null);
    const res = await this.sqlService.testConnection();
    this.isTestingSql.set(false);
    this.sqlTestResult.set(`${res.message} (Latencia: ${res.latencyMs}ms).`);
  }

  public async syncSql(): Promise<void> {
    this.sqlTestResult.set(null);
    const res = await this.sqlService.syncDatabase();
    this.medicationService.loadAll();
    this.authService.loadUsers();
    this.sqlTestResult.set(res.message);
  }

  public goToTableTab(tableName: string): void {
    if (tableName === 'medicamentos') this.activeTab.set('catalogo');
    else if (tableName === 'donaciones') this.activeTab.set('donaciones');
    else if (tableName === 'solicitudes_clinicas') this.activeTab.set('solicitudes');
    else if (tableName === 'usuarios' || tableName === 'roles') this.activeTab.set('usuarios');
  }
}
