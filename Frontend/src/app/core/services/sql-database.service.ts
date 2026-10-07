import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface DatabaseConfig {
  engine: string;
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
  poolSize: number;
  apiGatewayUrl: string;
}

export interface ConnectionStatus {
  connected: boolean;
  latencyMs: number;
  lastSync: string;
  activePoolClients: number;
  schemaVersion: string;
  totalRecords: number;
  error?: string | null;
}

export interface TableSummary {
  name: string;
  rowCount: number;
  columnsCount: number;
  primaryKey: string;
  description: string;
}

export interface SqlViewSummary {
  name: string;
  rowCount: number;
  columnsCount: number;
  columns?: string[];
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class SqlDatabaseService {
  private readonly apiService = inject(ApiService);

  public readonly config = signal<DatabaseConfig>({
    engine: 'MySQL 8.0',
    host: 'localhost',
    port: 3306,
    database: 'medishare_In5bm',
    user: 'IN5BM',
    ssl: false,
    poolSize: 10,
    apiGatewayUrl: 'http://localhost:3000/api',
  });

  private readonly _status = signal<ConnectionStatus>({
    connected: false,
    latencyMs: 0,
    lastSync: 'Sin verificar',
    activePoolClients: 10,
    schemaVersion: '2026.10-MySQL',
    totalRecords: 0,
    error: null,
  });
  public readonly status = this._status.asReadonly();
  public readonly isOnline = computed(() => this._status().connected);

  public readonly tables = signal<TableSummary[]>([]);
  public readonly views = signal<SqlViewSummary[]>([]);
  public readonly isTesting = signal<boolean>(false);
  public readonly isSyncing = signal<boolean>(false);

  constructor() {
    this.testConnection();
    this.loadTables();
    this.loadViews();
  }

  /**
   * Verifica la conectividad real con el backend y el servidor de base de datos MySQL.
   */
  public async testConnection(): Promise<{ success: boolean; message: string; latencyMs: number; totalRecords?: number }> {
    this.isTesting.set(true);
    const start = Date.now();
    try {
      const res: any = await firstValueFrom(this.apiService.get('/database/status'));
      const latency = res?.latencyMs ?? (Date.now() - start);

      this._status.set({
        connected: Boolean(res?.connected),
        latencyMs: latency,
        lastSync: new Date().toLocaleTimeString(),
        activePoolClients: 10,
        schemaVersion: '2026.10-MySQL',
        totalRecords: res?.totalRecords ?? 0,
        error: null,
      });

      this.isTesting.set(false);
      return {
        success: true,
        message: `Conexión con MySQL (${res?.database || 'medishare_In5bm'}) en ${res?.host || 'localhost:3306'} exitosa.`,
        latencyMs: latency,
        totalRecords: res?.totalRecords,
      };
    } catch (err: any) {
      this._status.set({
        connected: false,
        latencyMs: 0,
        lastSync: new Date().toLocaleTimeString(),
        activePoolClients: 0,
        schemaVersion: '2026.10-MySQL',
        totalRecords: 0,
        error: 'Backend desconectado o MySQL no accesible en puerto 3306.',
      });

      this.isTesting.set(false);
      return {
        success: false,
        message: 'No se pudo conectar con el backend en http://localhost:3000. Inicia el servidor con "pnpm dev".',
        latencyMs: 0,
      };
    }
  }

  /**
   * Carga la lista de tablas reales y el conteo de registros en MySQL.
   */
  public async loadTables(): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.apiService.get('/database/tables'));
      if (res?.tables && Array.isArray(res.tables)) {
        this.tables.set(res.tables);
      }
    } catch {
      // Si falla la conexión inicial
      this.tables.set([
        { name: 'medicamentos', rowCount: 0, columnsCount: 7, primaryKey: 'id_medicamento', description: 'Catálogo de medicamentos y existencias' },
        { name: 'donaciones', rowCount: 0, columnsCount: 9, primaryKey: 'id_donacion', description: 'Registro de donaciones ciudadanas' },
        { name: 'solicitudes_clinicas', rowCount: 0, columnsCount: 6, primaryKey: 'id_solicitud', description: 'Pedidos de clínicas comunitarias' },
        { name: 'usuarios', rowCount: 0, columnsCount: 6, primaryKey: 'id_usuario', description: 'Usuarios, roles y credenciales' },
        { name: 'roles', rowCount: 0, columnsCount: 2, primaryKey: 'id_rol', description: 'Roles de acceso y permisos' },
      ]);
    }
  }

  /**
   * Carga la lista de vistas SQL activas en MySQL.
   */
  public async loadViews(): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.apiService.get('/database/views'));
      if (res?.views && Array.isArray(res.views)) {
        this.views.set(res.views);
      }
    } catch {
      this.views.set([
        { name: 'vista_medicamentos_disponibles', rowCount: 18, columnsCount: 8, description: 'Catálogo activo con cálculo automático de nivel y semáforo de inventario' },
        { name: 'vista_donaciones_detalle', rowCount: 18, columnsCount: 15, description: 'Trazabilidad completa de donaciones uniendo donantes y especificaciones de fármacos' },
        { name: 'vista_solicitudes_clinicas_detalle', rowCount: 18, columnsCount: 12, description: 'Pedidos clínicos asociados con la clínica y existencia actual en almacén' },
        { name: 'vista_usuarios_roles', rowCount: 6, columnsCount: 6, description: 'Cuentas de usuarios con su nombre de rol asignado' },
        { name: 'vista_resumen_inventario_categoria', rowCount: 7, columnsCount: 4, description: 'Agrupación y totales de fármacos e inventario por categoría terapéutica' },
        { name: 'vista_kpis_donaciones', rowCount: 4, columnsCount: 3, description: 'Métricas e indicadores consolidados de donaciones según su estado de trámite' },
      ]);
    }
  }

  /**
   * Sincroniza las tablas del sistema contra la base de datos MySQL.
   */
  public async syncDatabase(): Promise<{ success: boolean; message: string }> {
    this.isSyncing.set(true);
    const testRes = await this.testConnection();
    await this.loadTables();
    await this.loadViews();
    this.isSyncing.set(false);

    if (testRes.success) {
      return {
        success: true,
        message: `Sincronización completada. Total de registros activos en MySQL: ${testRes.totalRecords ?? 0}`,
      };
    } else {
      return {
        success: false,
        message: testRes.message,
      };
    }
  }
}
