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

  // Estado modales
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

  public showUserModal = signal<boolean>(false);
  public userForm = {
    name: '',
    email: '',
    role: 'usuario' as UserRole,
    institution: '',
    status: 'Activo' as 'Activo' | 'Inactivo' | 'Pendiente',
  };

  // SQL test feedback
  public isTestingSql = signal<boolean>(false);
  public sqlTestResult = signal<string | null>(null);

  // CRUD Medicamentos
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

  // CRUD Donaciones
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

  // CRUD Solicitudes
  public changeRequestStatus(id: string, status: RequestStatus): void {
    this.medicationService.updateRequest(id, { status });
  }

  public deleteRequest(id: string): void {
    if (confirm('¿Deseas cancelar esta orden clínica?')) {
      this.medicationService.deleteRequest(id);
    }
  }

  // CRUD Usuarios
  public openNewUserModal(): void {
    this.userForm = {
      name: '',
      email: '',
      role: 'usuario',
      institution: '',
      status: 'Activo',
    };
    this.showUserModal.set(true);
  }

  public saveUser(): void {
    if (!this.userForm.name || !this.userForm.email) return;
    this.authService.createUserByAdmin(this.userForm);
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

  // SQL Operations
  public async testSqlConnection(): Promise<void> {
    this.isTestingSql.set(true);
    this.sqlTestResult.set(null);
    const res = await this.sqlService.testConnection();
    this.isTestingSql.set(false);
    this.sqlTestResult.set(`${res.message} (Latencia comprobada: ${res.latencyMs}ms).`);
  }

  public syncSql(): void {
    this.sqlService.syncDatabase();
    alert('Sincronización completada con la base de datos SQL PostgreSQL.');
  }
}
