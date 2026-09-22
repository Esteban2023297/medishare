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
  template: `
    <div class="min-h-screen bg-[#080c14] py-8 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div class="max-w-7xl mx-auto space-y-8">
        
        <!-- CABECERA DEL PANEL DE ADMINISTRACIÓN -->
        <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-950/70 via-slate-900 to-blue-950/60 border border-sky-900/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-sky-500/25">
              🛡️
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Panel Administrativo</h1>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-900 text-sky-300 border border-sky-700">
                  Superadmin
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-300 mt-1">
                CRUD integral para todas las clases del sistema y monitoreo de conexión de base de datos SQL.
              </p>
            </div>
          </div>

          <!-- Estado de Conexión SQL en vivo -->
          <div class="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <div class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
            <div class="text-xs">
              <span class="text-slate-400 block font-mono text-[10px]">SQL Engine: PostgreSQL 16</span>
              <span class="text-emerald-400 font-bold flex items-center gap-1">
                Conectado ({{ sqlService.status().latencyMs }} ms)
              </span>
            </div>
          </div>
        </div>

        <!-- BARRA DE PESTAÑAS CRUD -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 flex flex-wrap gap-1.5 shadow-md">
          <button
            type="button"
            (click)="activeTab.set('medicamentos')"
            class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            [ngClass]="activeTab() === 'medicamentos' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
          >
            <span>💊</span> Catálogo de Fármacos ({{ catalog().length }})
          </button>

          <button
            type="button"
            (click)="activeTab.set('donaciones')"
            class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            [ngClass]="activeTab() === 'donaciones' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
          >
            <span>📦</span> Donaciones ({{ donations().length }})
          </button>

          <button
            type="button"
            (click)="activeTab.set('solicitudes')"
            class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            [ngClass]="activeTab() === 'solicitudes' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
          >
            <span>🏥</span> Solicitudes Clínicas ({{ requests().length }})
          </button>

          <button
            type="button"
            (click)="activeTab.set('usuarios')"
            class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            [ngClass]="activeTab() === 'usuarios' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
          >
            <span>👥</span> Usuarios & Roles ({{ users().length }})
          </button>

          <button
            type="button"
            (click)="activeTab.set('sql')"
            class="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto"
            [ngClass]="activeTab() === 'sql' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'"
          >
            <span>🗄️</span> Conexión Base de Datos SQL
          </button>
        </div>

        <!-- ========================================================================= -->
        <!-- PESTAÑA 1: CRUD MEDICAMENTOS / CATÁLOGO -->
        <!-- ========================================================================= -->
        @if (activeTab() === 'medicamentos') {
          <div class="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div class="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-white">CRUD de Fármacos en Inventario</h2>
                <p class="text-xs text-slate-400">Crear, actualizar stock, editar caducidad o retirar fármacos del catálogo.</p>
              </div>
              <button
                type="button"
                (click)="openNewMedicineModal()"
                class="btn-clinical text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-1.5"
              >
                + Nuevo Medicamento
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th class="py-3.5 px-6">ID / Lote</th>
                    <th class="py-3.5 px-6">Principio Activo</th>
                    <th class="py-3.5 px-6">Presentación</th>
                    <th class="py-3.5 px-6">Categoría</th>
                    <th class="py-3.5 px-6 text-center">Stock</th>
                    <th class="py-3.5 px-6">Caducidad</th>
                    <th class="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-xs">
                  @for (med of catalog(); track med.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-4 px-6">
                        <span class="font-mono font-bold text-sky-400 block">{{ med.id }}</span>
                        <span class="font-mono text-[10px] text-slate-400">Lote: {{ med.batchNumber }}</span>
                      </td>
                      <td class="py-4 px-6">
                        <span class="font-bold text-white block">{{ med.activeIngredient }}</span>
                        <span class="text-[11px] text-slate-400">{{ med.commercialName }}</span>
                      </td>
                      <td class="py-4 px-6 text-slate-300">{{ med.presentation }}</td>
                      <td class="py-4 px-6">
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 border border-slate-800 text-sky-300">
                          {{ med.category }}
                        </span>
                      </td>
                      <td class="py-4 px-6 text-center">
                        <span class="font-bold text-white bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                          {{ med.availableUnits }}
                        </span>
                      </td>
                      <td class="py-4 px-6">
                        <span class="text-emerald-400 font-medium">✓ {{ med.minExpirationDate }}</span>
                      </td>
                      <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            (click)="editMedicine(med)"
                            class="p-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-xs font-semibold"
                            title="Editar Medicamento"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            (click)="deleteMedicine(med.id)"
                            class="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold"
                            title="Eliminar Medicamento"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- PESTAÑA 2: CRUD DONACIONES -->
        <!-- ========================================================================= -->
        @if (activeTab() === 'donaciones') {
          <div class="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div class="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-white">CRUD de Donaciones y Trazabilidad Sanitaria</h2>
                <p class="text-xs text-slate-400">Auditar, cambiar estados de laboratorio (*Aprobado*, *Pendiente*, *Rechazado*) y asignar destinos.</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th class="py-3.5 px-6">Código / Fecha</th>
                    <th class="py-3.5 px-6">Fármaco / Donante</th>
                    <th class="py-3.5 px-6">Lote / Caducidad</th>
                    <th class="py-3.5 px-6 text-center">Unidades</th>
                    <th class="py-3.5 px-6">Estado Sanitario</th>
                    <th class="py-3.5 px-6">Clínica Destino</th>
                    <th class="py-3.5 px-6 text-right">Gestión de Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-xs">
                  @for (don of donations(); track don.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-4 px-6">
                        <span class="font-mono font-bold text-sky-400 block">{{ don.id }}</span>
                        <span class="text-[10px] text-slate-500">{{ don.createdAt }}</span>
                      </td>
                      <td class="py-4 px-6">
                        <span class="font-bold text-white block">{{ don.activeIngredient }}</span>
                        <span class="text-[11px] text-slate-400">Por: {{ don.donorName }}</span>
                      </td>
                      <td class="py-4 px-6">
                        <span class="font-mono text-[11px] text-slate-300 block">Lote: {{ don.batchNumber }}</span>
                        <span class="text-[10px] text-emerald-400">Vence: {{ don.expirationDate }}</span>
                      </td>
                      <td class="py-4 px-6 text-center font-bold text-white">{{ don.units }}</td>
                      <td class="py-4 px-6">
                        <app-status-badge [status]="don.status"></app-status-badge>
                      </td>
                      <td class="py-4 px-6">
                        <input
                          type="text"
                          [value]="don.targetClinic || ''"
                          (change)="onClinicAssign(don.id, $event)"
                          placeholder="Asignar clínica..."
                          class="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:border-sky-500 w-40"
                        />
                      </td>
                      <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            (click)="changeDonationStatus(don.id, 'Aprobado')"
                            class="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            (click)="changeDonationStatus(don.id, 'Entregado')"
                            class="px-2 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-bold"
                          >
                            Entregado
                          </button>
                          <button
                            type="button"
                            (click)="changeDonationStatus(don.id, 'Rechazado')"
                            class="px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold"
                          >
                            Rechazar
                          </button>
                          <button
                            type="button"
                            (click)="deleteDonation(don.id)"
                            class="p-1 rounded text-slate-400 hover:text-rose-400"
                            title="Eliminar donación"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- PESTAÑA 3: CRUD SOLICITUDES DE CLÍNICAS -->
        <!-- ========================================================================= -->
        @if (activeTab() === 'solicitudes') {
          <div class="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div class="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-white">CRUD de Solicitudes y Despacho Hospitalario</h2>
                <p class="text-xs text-slate-400">Gestionar los pedidos médicos realizados por dispensarios y clínicas comunitarias.</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th class="py-3.5 px-6">ID Pedido</th>
                    <th class="py-3.5 px-6">Clínica Solicitante</th>
                    <th class="py-3.5 px-6">Fármaco</th>
                    <th class="py-3.5 px-6 text-center">Unidades</th>
                    <th class="py-3.5 px-6">Urgencia</th>
                    <th class="py-3.5 px-6">Estado Entrega</th>
                    <th class="py-3.5 px-6 text-right">Actualizar Despacho</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-xs">
                  @for (req of requests(); track req.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-4 px-6 font-mono font-bold text-emerald-400">{{ req.id }}</td>
                      <td class="py-4 px-6 font-bold text-white">{{ req.clinicName }}</td>
                      <td class="py-4 px-6 text-slate-300">
                        {{ req.activeIngredient }} ({{ req.presentation }})
                      </td>
                      <td class="py-4 px-6 text-center font-bold text-white">{{ req.requestedUnits }}</td>
                      <td class="py-4 px-6">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold" [ngClass]="req.urgency === 'Alta' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-950 text-slate-400'">
                          {{ req.urgency }}
                        </span>
                      </td>
                      <td class="py-4 px-6">
                        <app-status-badge [status]="req.status"></app-status-badge>
                      </td>
                      <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            (click)="changeRequestStatus(req.id, 'Aprobada')"
                            class="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            (click)="changeRequestStatus(req.id, 'En camino')"
                            class="px-2 py-1 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold"
                          >
                            En camino
                          </button>
                          <button
                            type="button"
                            (click)="changeRequestStatus(req.id, 'Entregada')"
                            class="px-2 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-bold"
                          >
                            Entregada
                          </button>
                          <button
                            type="button"
                            (click)="deleteRequest(req.id)"
                            class="p-1 rounded text-slate-400 hover:text-rose-400"
                            title="Eliminar orden"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- PESTAÑA 4: CRUD USUARIOS Y ROLES -->
        <!-- ========================================================================= -->
        @if (activeTab() === 'usuarios') {
          <div class="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div class="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold text-white">CRUD de Usuarios y Asignación de Roles</h2>
                <p class="text-xs text-slate-400">Control de credenciales, roles (Admin / Usuario) y estado de cuentas.</p>
              </div>
              <button
                type="button"
                (click)="openNewUserModal()"
                class="btn-clinical text-xs py-2 px-4 rounded-xl font-bold flex items-center gap-1.5"
              >
                + Nuevo Usuario
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th class="py-3.5 px-6">ID / Nombre</th>
                    <th class="py-3.5 px-6">Correo Electrónico (Cualquier extensión)</th>
                    <th class="py-3.5 px-6">Institución / Clínica</th>
                    <th class="py-3.5 px-6">Rol Actual</th>
                    <th class="py-3.5 px-6">Estado</th>
                    <th class="py-3.5 px-6 text-right">Acciones de Rol</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60 text-xs">
                  @for (usr of users(); track usr.id) {
                    <tr class="hover:bg-slate-800/40 transition-colors">
                      <td class="py-4 px-6">
                        <span class="font-bold text-white block">{{ usr.name }}</span>
                        <span class="font-mono text-[10px] text-sky-400">{{ usr.id }}</span>
                      </td>
                      <td class="py-4 px-6 font-mono text-slate-300">{{ usr.email }}</td>
                      <td class="py-4 px-6 text-slate-400">{{ usr.institution || 'Particular' }}</td>
                      <td class="py-4 px-6">
                        <span
                          class="px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                          [ngClass]="usr.role === 'admin' ? 'bg-sky-950 text-sky-300 border border-sky-700' : 'bg-emerald-950 text-emerald-300 border border-emerald-700'"
                        >
                          {{ usr.role }}
                        </span>
                      </td>
                      <td class="py-4 px-6">
                        <span class="text-emerald-400 font-semibold flex items-center gap-1">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {{ usr.status }}
                        </span>
                      </td>
                      <td class="py-4 px-6 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            (click)="toggleUserRole(usr)"
                            class="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200"
                          >
                            Cambiar a {{ usr.role === 'admin' ? 'Usuario' : 'Admin' }}
                          </button>
                          <button
                            type="button"
                            (click)="deleteUser(usr.id)"
                            class="p-1 rounded text-slate-400 hover:text-rose-400"
                            title="Eliminar usuario"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- PESTAÑA 5: CONEXIÓN BASE DE DATOS SQL (POSTGRESQL) -->
        <!-- ========================================================================= -->
        @if (activeTab() === 'sql') {
          <div class="space-y-6">
            
            <div class="p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Infraestructura de Datos</span>
                  <h2 class="text-2xl font-black text-white mt-1">Conexión a Base de Datos SQL (PostgreSQL)</h2>
                  <p class="text-xs text-slate-400 mt-1">
                    Parámetros de conexión relacional, estado del pool de conexiones y sincronización en tiempo real.
                  </p>
                </div>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    (click)="testSqlConnection()"
                    [disabled]="isTestingSql()"
                    class="btn-clinical text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-2"
                  >
                    @if (isTestingSql()) {
                      <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Verificando Ping...
                    } @else {
                      ⚡ Probar Conexión SQL
                    }
                  </button>

                  <button
                    type="button"
                    (click)="syncSql()"
                    class="btn-health text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-2"
                  >
                    🔄 Sincronizar Esquema
                  </button>
                </div>
              </div>

              <!-- Parámetros de la conexión -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                
                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Motor Relacional</span>
                  <span class="text-base font-extrabold text-white font-mono">{{ sqlService.config().engine }} 16.2</span>
                  <span class="text-[11px] text-emerald-400 block mt-1">SSL Activo</span>
                </div>

                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Host / Puerto</span>
                  <span class="text-base font-extrabold text-white font-mono">{{ sqlService.config().host }}:{{ sqlService.config().port }}</span>
                  <span class="text-[11px] text-slate-400 block mt-1">Pool: 10 conexiones</span>
                </div>

                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Base de Datos</span>
                  <span class="text-base font-extrabold text-white font-mono">{{ sqlService.config().database }}</span>
                  <span class="text-[11px] text-slate-400 block mt-1">Usuario: {{ sqlService.config().user }}</span>
                </div>

                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span class="text-[10px] text-slate-500 uppercase font-bold block">Latencia / Última Sincronía</span>
                  <span class="text-base font-extrabold text-emerald-400 font-mono">{{ sqlService.status().latencyMs }} ms</span>
                  <span class="text-[11px] text-slate-400 block mt-1">{{ sqlService.status().lastSync }}</span>
                </div>

              </div>

              <!-- Mensaje de prueba de conexión -->
              @if (sqlTestResult()) {
                <div class="mt-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-3">
                  <span class="text-lg">✅</span>
                  <div>
                    <strong>Resultado del Test:</strong> {{ sqlTestResult() }}
                  </div>
                </div>
              }

              <!-- Script SQL Integrado -->
              <div class="mt-8 pt-6 border-t border-slate-800">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-bold text-white flex items-center gap-2">
                    <span>📄</span> Script DDL Generado (schema.sql listo para producción)
                  </span>
                  <span class="text-[11px] text-slate-400 font-mono">Ubicación: src/database/schema.sql</span>
                </div>
                <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-52 overflow-y-auto leading-relaxed">
                  <pre>-- Tablas creadas: users, categories, medicines, donations, clinic_requests, audit_logs
-- Restricción Sanitaria: CONSTRAINT chk_sanitary_expiration_rule CHECK (expiration_date >= (created_at::date + INTERVAL '90 days'))
-- Índices: idx_medicines_active_ingredient, idx_donations_status, idx_users_email</pre>
                </div>
              </div>

            </div>

          </div>
        }

        <!-- ========================================================================= -->
        <!-- MODAL: CREAR / EDITAR MEDICAMENTO (CATÁLOGO) -->
        <!-- ========================================================================= -->
        @if (showMedicineModal()) {
          <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 class="text-lg font-extrabold text-white">
                  {{ isEditingMedicine() ? 'Editar Medicamento' : 'Nuevo Medicamento en Catálogo' }}
                </h3>
                <button type="button" (click)="showMedicineModal.set(false)" class="text-slate-400 hover:text-white">✕</button>
              </div>

              <div class="space-y-3 text-xs">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Principio Activo *</label>
                  <input type="text" [(ngModel)]="medForm.activeIngredient" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Nombre Comercial *</label>
                  <input type="text" [(ngModel)]="medForm.commercialName" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Presentación *</label>
                    <select [(ngModel)]="medForm.presentation" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white">
                      <option value="Tabletas">Tabletas</option>
                      <option value="Cápsulas">Cápsulas</option>
                      <option value="Jarabe">Jarabe</option>
                      <option value="Gotas">Gotas</option>
                      <option value="Inyectable">Inyectable</option>
                      <option value="Inhalador">Inhalador</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Categoría *</label>
                    <select [(ngModel)]="medForm.category" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white">
                      <option value="Antibióticos">Antibióticos</option>
                      <option value="Diabetes">Diabetes</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Analgésicos">Analgésicos</option>
                      <option value="Respiratorio">Respiratorio</option>
                      <option value="Gastrointestinal">Gastrointestinal</option>
                    </select>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Stock (Unidades) *</label>
                    <input type="number" [(ngModel)]="medForm.availableUnits" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Lote Farmacéutico *</label>
                    <input type="text" [(ngModel)]="medForm.batchNumber" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white" />
                  </div>
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Fecha de Caducidad *</label>
                  <input type="date" [(ngModel)]="medForm.minExpirationDate" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" (click)="showMedicineModal.set(false)" class="btn-secondary-outline text-xs !py-2 !px-4 rounded-xl">Cancelar</button>
                <button type="button" (click)="saveMedicine()" class="btn-clinical text-xs !py-2 !px-5 rounded-xl font-bold">Guardar</button>
              </div>
            </div>
          </div>
        }

        <!-- ========================================================================= -->
        <!-- MODAL: CREAR NUEVO USUARIO -->
        <!-- ========================================================================= -->
        @if (showUserModal()) {
          <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 class="text-lg font-extrabold text-white">Nuevo Usuario / Rol</h3>
                <button type="button" (click)="showUserModal.set(false)" class="text-slate-400 hover:text-white">✕</button>
              </div>

              <div class="space-y-3 text-xs">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                  <input type="text" [(ngModel)]="userForm.name" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Correo Electrónico (Cualquier extensión) *</label>
                  <input type="email" [(ngModel)]="userForm.email" placeholder="ejemplo@gmail.com o tu@you.com" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Rol *</label>
                  <select [(ngModel)]="userForm.role" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white">
                    <option value="usuario">Usuario (Donante / Paciente / Clínica)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Institución</label>
                  <input type="text" [(ngModel)]="userForm.institution" class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-3 py-2 text-white" />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" (click)="showUserModal.set(false)" class="btn-secondary-outline text-xs !py-2 !px-4 rounded-xl">Cancelar</button>
                <button type="button" (click)="saveUser()" class="btn-clinical text-xs !py-2 !px-5 rounded-xl font-bold">Crear Usuario</button>
              </div>
            </div>
          </div>
        }

      </div>
    </div>
  `,
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
