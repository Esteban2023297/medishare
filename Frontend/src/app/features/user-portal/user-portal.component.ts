import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MedicationService } from '../../core/services/medication.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-user-portal',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './user-portal.component.html',
  styleUrl: './user-portal.component.scss',
})
export class UserPortalComponent {
  private readonly authService = inject(AuthService);
  private readonly medicationService = inject(MedicationService);

  public readonly currentUser = this.authService.currentUser;
  public readonly donations = this.medicationService.donations;
  public readonly selectedStatusFilter = signal<string>('Todos');

  public readonly userInitials = computed(() => {
    const name = this.currentUser()?.name || 'US';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  public readonly filteredUserDonations = computed(() => {
    const filter = this.selectedStatusFilter();
    const all = this.donations();
    if (filter === 'Todos') return all;
    return all.filter((d) => d.status === filter);
  });

  public readonly userTotalUnits = computed(() => {
    return this.donations().reduce((acc, d) => acc + d.units, 0);
  });

  public readonly userApprovedCount = computed(() => {
    return this.donations().filter((d) => d.status === 'Aprobado' || d.status === 'Entregado').length;
  });

  public readonly userPendingCount = computed(() => {
    return this.donations().filter((d) => d.status === 'Pendiente' || d.status === 'En revisión').length;
  });
}
