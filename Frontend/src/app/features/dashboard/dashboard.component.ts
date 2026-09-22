import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MedicationService } from '../../core/services/medication.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="min-h-screen bg-[#080c14] py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Cabecera de Usuario y Panel -->
        <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              MR
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Mi Panel de Control</h1>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">Donante Activa</span>
              </div>
              <p class="text-xs sm:text-sm text-slate-400 mt-0.5">Bienvenida, María Rodríguez • Trazabilidad y seguimiento de fármacos</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <a
              routerLink="/donar"
              class="btn-clinical text-xs !py-2.5 !px-4 rounded-xl font-bold shadow-md flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva Donación
            </a>
          </div>
        </div>

        <!-- TARJETAS DE RESUMEN SUPERIOR -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          
          <!-- Card Total Donado -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Unidades Donadas</span>
              <p class="text-2xl font-black text-white mt-1">{{ totalDonatedUnits() }} <span class="text-xs font-normal text-slate-400">uds.</span></p>
              <span class="text-[11px] text-emerald-400 mt-1 block">Aporte verificado</span>
            </div>
            <div class="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>

          <!-- Card Donaciones Aprobadas / Entregadas -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Aprobadas / Entregadas</span>
              <p class="text-2xl font-black text-emerald-400 mt-1">{{ approvedDonationsCount() }}</p>
              <span class="text-[11px] text-slate-400 mt-1 block">En clínica o dispensario</span>
            </div>
            <div class="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <!-- Card Pendientes de Inspección -->
          <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center justify-between">
            <div>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Pendientes / En revisión</span>
              <p class="text-2xl font-black text-amber-400 mt-1">{{ pendingDonationsCount() }}</p>
              <span class="text-[11px] text-amber-400/80 mt-1 block">Filtro de laboratorio</span>
            </div>
            <div class="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

        </div>

        <!-- PESTAÑAS Y TABLA DE GESTIÓN -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-8">
          
          <!-- Selector de Pestañas -->
          <div class="border-b border-slate-800 px-6 pt-4 flex items-center justify-between">
            <div class="flex items-center gap-6">
              <button
                type="button"
                (click)="activeTab.set('donaciones')"
                class="pb-3 text-sm font-bold border-b-2 transition-colors relative"
                [ngClass]="activeTab() === 'donaciones' ? 'text-sky-400 border-sky-400' : 'text-slate-400 border-transparent hover:text-slate-200'"
              >
                Mis Donaciones ({{ donations().length }})
              </button>

              <button
                type="button"
                (click)="activeTab.set('solicitudes')"
                class="pb-3 text-sm font-bold border-b-2 transition-colors relative"
                [ngClass]="activeTab() === 'solicitudes' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-slate-200'"
              >
                Solicitudes de Clínicas ({{ requests().length }})
              </button>
            </div>

            <span class="text-xs text-slate-500 hidden sm:inline-block">Trazabilidad en tiempo real</span>
          </div>

          <!-- TAB 1: TABLA DE DONACIONES -->
          @if (activeTab() === 'donaciones') {
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th class="py-3.5 px-6">Código / Fecha</th>
                    <th class="py-3.5 px-6">Medicamento</th>
                    <th class="py-3.5 px-6">Presentación / Lote</th>
                    <th class="py-3.5 px-6 text-center">Unidades</th>
                    <th class="py-3.5 px-6">Caducidad</th>
                    <th class="py-3.5 px-6">Estado Sanitario</th>
                    <th class="py-3.5 px-6">Destino / Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-xs">
                  @for (item of donations(); track item.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      
                      <!-- Código y Fecha -->
                      <td class="py-4 px-6">
                        <span class="font-mono font-bold text-sky-400 block">{{ item.id }}</span>
                        <span class="text-[11px] text-slate-500">{{ item.createdAt }}</span>
                      </td>

                      <!-- Medicamento -->
                      <td class="py-4 px-6">
                        <span class="font-bold text-white block">{{ item.activeIngredient }}</span>
                        <span class="text-[11px] text-slate-400">{{ item.commercialName }}</span>
                      </td>

                      <!-- Presentación y Lote -->
                      <td class="py-4 px-6">
                        <span class="text-slate-300 block">{{ item.presentation }}</span>
                        <span class="font-mono text-[10px] text-slate-400">Lote: {{ item.batchNumber }}</span>
                      </td>

                      <!-- Unidades -->
                      <td class="py-4 px-6 text-center">
                        <span class="font-bold text-white bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                          {{ item.units }}
                        </span>
                      </td>

                      <!-- Caducidad -->
                      <td class="py-4 px-6">
                        <span class="text-slate-300">{{ item.expirationDate }}</span>
                      </td>

                      <!-- Estado Sanitario -->
                      <td class="py-4 px-6">
                        <app-status-badge [status]="item.status"></app-status-badge>
                      </td>

                      <!-- Destino / Clínica -->
                      <td class="py-4 px-6">
                        @if (item.targetClinic) {
                          <span class="text-slate-300 flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {{ item.targetClinic }}
                          </span>
                        } @else {
                          <span class="text-slate-500 italic">En asignación</span>
                        }
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- TAB 2: TABLA DE SOLICITUDES DE CLÍNICAS -->
          @if (activeTab() === 'solicitudes') {
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th class="py-3.5 px-6">ID Pedido</th>
                    <th class="py-3.5 px-6">Clínica Solicitante</th>
                    <th class="py-3.5 px-6">Fármaco Requerido</th>
                    <th class="py-3.5 px-6 text-center">Cantidad</th>
                    <th class="py-3.5 px-6">Nivel Urgencia</th>
                    <th class="py-3.5 px-6">Fecha Pedido</th>
                    <th class="py-3.5 px-6">Estado Entrega</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-xs">
                  @for (req of requests(); track req.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-4 px-6 font-mono font-bold text-emerald-400">{{ req.id }}</td>
                      <td class="py-4 px-6 font-semibold text-white">{{ req.clinicName }}</td>
                      <td class="py-4 px-6 text-slate-300">
                        {{ req.activeIngredient }}
                        <span class="text-[11px] text-slate-400 block">{{ req.presentation }}</span>
                      </td>
                      <td class="py-4 px-6 text-center font-bold text-white">{{ req.requestedUnits }} uds.</td>
                      <td class="py-4 px-6">
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          [ngClass]="
                            req.urgency === 'Alta'
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                              : 'bg-slate-800 text-slate-300'
                          "
                        >
                          {{ req.urgency }}
                        </span>
                      </td>
                      <td class="py-4 px-6 text-slate-400">{{ req.requestDate }}</td>
                      <td class="py-4 px-6">
                        <app-status-badge [status]="req.status"></app-status-badge>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

        </div>

        <!-- ACTIVIDAD RECIENTE / AUDITORÍA EN TIEMPO REAL -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              Actividad Reciente y Auditoría
            </h3>
            <span class="text-[11px] text-slate-400">Trazabilidad sanitaria certificada</span>
          </div>

          <div class="space-y-3">
            @for (act of recentActivity; track act.id) {
              <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold" [ngClass]="act.iconBg">
                    {{ act.icon }}
                  </span>
                  <div>
                    <p class="font-medium text-slate-200">{{ act.message }}</p>
                    <span class="text-[11px] text-slate-400">{{ act.subtext }}</span>
                  </div>
                </div>
                <span class="text-[11px] font-mono text-slate-400 shrink-0">{{ act.time }}</span>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
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
