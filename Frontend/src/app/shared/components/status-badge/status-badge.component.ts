import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DonationStatus, RequestStatus } from '../../../core/models/medication.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: DonationStatus | RequestStatus | string;

  get badgeClass(): string {
    switch (this.status) {
      case 'Aprobado':
      case 'Aprobada':
      case 'Entregado':
      case 'Entregada':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 shadow-sm';
      case 'Pendiente':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/60 shadow-sm';
      case 'En revisión':
      case 'En camino':
        return 'bg-sky-950/40 text-sky-400 border-sky-800/60 shadow-sm';
      case 'Rechazado':
        return 'bg-rose-950/40 text-rose-400 border-rose-800/60 shadow-sm';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  get dotClass(): string {
    switch (this.status) {
      case 'Aprobado':
      case 'Aprobada':
      case 'Entregado':
      case 'Entregada':
        return 'bg-emerald-400 animate-pulse';
      case 'Pendiente':
        return 'bg-amber-400';
      case 'En revisión':
      case 'En camino':
        return 'bg-sky-400 animate-pulse';
      case 'Rechazado':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  }
}
