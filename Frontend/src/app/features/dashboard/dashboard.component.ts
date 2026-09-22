import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MedicationService } from '../../core/services/medication.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly medicationService = inject(MedicationService);

  public readonly donations = this.medicationService.donations;
  public readonly requests = this.medicationService.requests;
  public readonly activeTab = signal<'donaciones' | 'solicitudes'>('donaciones');

  public readonly totalDonatedUnits = computed(() => {
    return this.donations().reduce((acc, d) => acc + d.units, 0);
  });

  public readonly approvedDonationsCount = computed(() => {
    return this.donations().filter(
      (d) => d.status === 'Aprobado' || d.status === 'Entregado'
    ).length;
  });

  public readonly pendingDonationsCount = computed(() => {
    return this.donations().filter(
      (d) => d.status === 'Pendiente' || d.status === 'En revisión'
    ).length;
  });

  public readonly recentActivity = [
    {
      id: 1,
      icon: '✓',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      message: 'DON-002 aprobado por el sistema de inspección farmacéutica',
      subtext: 'Lote MET-850-99 verificado sin alteraciones',
      time: 'Hace 2 horas',
    },
    {
      id: 2,
      icon: '➔',
      iconBg: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
      message: 'DON-001 entregado a Clínica Comunitaria Esperanza',
      subtext: '120 unidades de Amoxicilina en inventario activo',
      time: 'Hace 1 día',
    },
    {
      id: 3,
      icon: '⏳',
      iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      message: 'DON-004 ingresó a protocolo de revisión de empaque',
      subtext: 'Inspección visual de sello y temperatura de almacenamiento',
      time: 'Hace 2 días',
    },
  ];
}
