import { Request, Response } from 'express';
import { pool, checkDatabaseConnection } from '../config/db';
import { ENV } from '../config/env';

export interface TableSummary {
  name: string;
  rowCount: number;
  columnsCount: number;
  primaryKey: string;
  description: string;
}

export interface ViewSummary {
  name: string;
  rowCount: number;
  columnsCount: number;
  columns: string[];
  description: string;
}

export async function getDatabaseStatus(req: Request, res: Response): Promise<void> {
  const check = await checkDatabaseConnection();

  if (!check.connected) {
    res.status(503).json({
      connected: false,
      engine: 'MySQL 8.0',
      host: `${ENV.DB_HOST}:${ENV.DB_PORT}`,
      database: ENV.DB_NAME,
      user: ENV.DB_USER,
      latencyMs: check.latencyMs,
      error: check.error || 'No se pudo conectar a MySQL',
    });
    return;
  }

  try {
    const [meds]: any = await pool.query('SELECT COUNT(*) as count FROM medicamentos');
    const [dons]: any = await pool.query('SELECT COUNT(*) as count FROM donaciones');
    const [reqs]: any = await pool.query('SELECT COUNT(*) as count FROM solicitudes_clinicas');
    const [usrs]: any = await pool.query('SELECT COUNT(*) as count FROM usuarios');
    const [rols]: any = await pool.query('SELECT COUNT(*) as count FROM roles');
    const [viewsCountRaw]: any = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_schema = ?
    `, [ENV.DB_NAME]);

    const totalRecords =
      Number(meds[0].count) +
      Number(dons[0].count) +
      Number(reqs[0].count) +
      Number(usrs[0].count) +
      Number(rols[0].count);

    res.json({
      connected: true,
      engine: 'MySQL 8.0',
      host: `${ENV.DB_HOST}:${ENV.DB_PORT}`,
      database: ENV.DB_NAME,
      user: ENV.DB_USER,
      latencyMs: check.latencyMs,
      tablesCount: 5,
      viewsCount: Number(viewsCountRaw[0]?.count) || 6,
      totalRecords,
      lastSync: new Date().toISOString(),
      counts: {
        medicamentos: Number(meds[0].count),
        donaciones: Number(dons[0].count),
        solicitudes_clinicas: Number(reqs[0].count),
        usuarios: Number(usrs[0].count),
        roles: Number(rols[0].count),
      },
    });
  } catch (error: any) {
    console.error('Error al obtener estado de base de datos:', error);
    res.status(500).json({
      connected: false,
      error: 'Error al consultar métricas de MySQL',
      details: error?.message,
    });
  }
}

export async function getDatabaseTables(req: Request, res: Response): Promise<void> {
  try {
    const [tablesRaw]: [any[], any] = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ? AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `, [ENV.DB_NAME]);

    const summaries: TableSummary[] = [];

    const tableDescriptions: Record<string, { desc: string; pk: string }> = {
      medicamentos: { desc: 'Catálogo de medicamentos, principio activo, categoría y existencias', pk: 'id_medicamento' },
      donaciones: { desc: 'Registro de donaciones ciudadanas con lote, caducidad y estado sanitario', pk: 'id_donacion' },
      solicitudes_clinicas: { desc: 'Pedidos de fármacos solicitados por clínicas comunitarias', pk: 'id_solicitud' },
      usuarios: { desc: 'Cuentas de usuario registradas con rol asignado y credenciales', pk: 'id_usuario' },
      roles: { desc: 'Catálogo de permisos y perfiles (donante, clinica, administrador)', pk: 'id_rol' },
    };

    for (const t of tablesRaw) {
      const name = t.TABLE_NAME || t.table_name;
      const [countRows]: any = await pool.query(`SELECT COUNT(*) as count FROM ${name}`);
      const [colsRows]: any = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = ? AND table_name = ?
      `, [ENV.DB_NAME, name]);

      const meta = tableDescriptions[name] || { desc: 'Tabla del sistema', pk: 'id' };

      summaries.push({
        name,
        rowCount: Number(countRows[0].count),
        columnsCount: colsRows.length,
        primaryKey: meta.pk,
        description: meta.desc,
      });
    }

    res.json({
      database: ENV.DB_NAME,
      count: summaries.length,
      tables: summaries,
    });
  } catch (error: any) {
    console.error('Error al listar tablas de MySQL:', error);
    res.status(500).json({ error: 'Error al obtener tablas de MySQL', details: error?.message });
  }
}

export async function getDatabaseViews(req: Request, res: Response): Promise<void> {
  try {
    const [viewsRaw]: [any[], any] = await pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = ?
      ORDER BY table_name ASC
    `, [ENV.DB_NAME]);

    const viewDescriptions: Record<string, string> = {
      vista_medicamentos_disponibles: 'Catálogo activo con cálculo automático de nivel y semáforo de inventario (Crítico/Bajo/Óptimo)',
      vista_donaciones_detalle: 'Trazabilidad completa de donaciones uniendo donantes y especificaciones de fármacos',
      vista_solicitudes_clinicas_detalle: 'Pedidos clínicos asociados con la clínica y existencia actual en almacén',
      vista_usuarios_roles: 'Cuentas de usuarios con su nombre de rol asignado (donante, clínica, administrador)',
      vista_resumen_inventario_categoria: 'Agrupación y totales de fármacos e inventario por categoría terapéutica',
      vista_kpis_donaciones: 'Métricas e indicadores consolidados de donaciones según su estado de trámite',
    };

    const summaries: ViewSummary[] = [];

    for (const v of viewsRaw) {
      const name = v.TABLE_NAME || v.table_name;
      let count = 0;
      try {
        const [c]: any = await pool.query(`SELECT COUNT(*) as count FROM ${name}`);
        count = Number(c[0]?.count) || 0;
      } catch (_) {}

      const [colsRows]: any = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = ? AND table_name = ?
        ORDER BY ordinal_position ASC
      `, [ENV.DB_NAME, name]);

      const cols = colsRows.map((col: any) => col.COLUMN_NAME || col.column_name);

      summaries.push({
        name,
        rowCount: count,
        columnsCount: cols.length,
        columns: cols,
        description: viewDescriptions[name] || 'Vista relacional SQL de MediShare',
      });
    }

    res.json({
      database: ENV.DB_NAME,
      count: summaries.length,
      views: summaries,
    });
  } catch (error: any) {
    console.error('Error al listar vistas de MySQL:', error);
    res.status(500).json({ error: 'Error al obtener vistas de MySQL', details: error?.message });
  }
}
