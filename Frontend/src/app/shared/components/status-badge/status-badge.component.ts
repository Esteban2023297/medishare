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

  private get normalized(): string {
    return (this.status || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  get badgeClass(): string {
    const s = this.normalized;
    if (s.includes('aprob') || s.includes('entreg')) {
      return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 shadow-sm';
    }
    if (s.includes('pend')) {
      return 'bg-amber-950/40 text-amber-300 border-amber-800/60 shadow-sm';
    }
    if (s.includes('revis') || s.includes('camino')) {
      return 'bg-sky-950/40 text-sky-400 border-sky-800/60 shadow-sm';
    }
    if (s.includes('rechaz')) {
      return 'bg-rose-950/40 text-rose-400 border-rose-800/60 shadow-sm';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  }

  get dotClass(): string {
    const s = this.normalized;
    if (s.includes('aprob') || s.includes('entreg')) {
      return 'bg-emerald-400 animate-pulse';
    }
    if (s.includes('pend')) {
      return 'bg-amber-400';
    }
    if (s.includes('revis') || s.includes('camino')) {
      return 'bg-sky-400 animate-pulse';
    }
    if (s.includes('rechaz')) {
      return 'bg-rose-500';
    }
    return 'bg-slate-400';
  }
}
