import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CatalogItem } from '../../core/models/medication.model';
import { MedicationService } from '../../core/services/medication.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
})
export class CatalogComponent {
  public readonly medicationService = inject(MedicationService);
  public readonly catalog = this.medicationService.filteredCatalog;

  public readonly categories = [
    'Todos',
    'Antibióticos',
    'Diabetes',
    'Cardio',
    'Analgésicos',
    'Respiratorio',
    'Gastrointestinal',
  ];

  public selectedMedicineForRequest = signal<CatalogItem | null>(null);
  public requestClinicName = 'Clínica Comunitaria Esperanza';
  public requestUnits = 20;
  public requestUrgency: 'Alta' | 'Media' | 'Baja' = 'Media';
  public toastMessage = signal<string | null>(null);

  public onSearchChange(query: string): void {
    this.medicationService.setSearchQuery(query);
  }

  public selectCategory(cat: string): void {
    this.medicationService.setSelectedCategory(cat);
  }

  public resetFilters(): void {
    this.medicationService.setSearchQuery('');
    this.medicationService.setSelectedCategory('Todos');
  }

  public formatExpiryDate(isoDate: string): string {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${months[monthIdx]} ${parts[0]}`;
    }
    return isoDate;
  }

  public openRequestModal(med: CatalogItem): void {
    this.selectedMedicineForRequest.set(med);
    this.requestUnits = Math.min(20, med.availableUnits);
  }

  public closeRequestModal(): void {
    this.selectedMedicineForRequest.set(null);
  }

  public confirmRequest(): void {
    const med = this.selectedMedicineForRequest();
    if (!med) return;

    const result = this.medicationService.requestMedicine(
      med.id,
      this.requestClinicName,
      this.requestUnits,
      this.requestUrgency
    );

    this.closeRequestModal();

    if (result.success) {
      this.toastMessage.set(result.message);
      setTimeout(() => this.toastMessage.set(null), 4000);
    }
  }
}
