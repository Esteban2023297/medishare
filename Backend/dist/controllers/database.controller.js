"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseStatus = getDatabaseStatus;
exports.getDatabaseTables = getDatabaseTables;
exports.getDatabaseViews = getDatabaseViews;
const db_1 = require("../config/db");
const env_1 = require("../config/env");
async function getDatabaseStatus(req, res) {
    const check = await (0, db_1.checkDatabaseConnection)();
    if (!check.connected) {
        res.status(503).json({
            connected: false,
            engine: 'MySQL 8.0',
            host: `${env_1.ENV.DB_HOST}:${env_1.ENV.DB_PORT}`,
            database: env_1.ENV.DB_NAME,
            user: env_1.ENV.DB_USER,
            latencyMs: check.latencyMs,
            error: check.error || 'No se pudo conectar a MySQL',
        });
        return;
    }
    try {
        const [meds] = await db_1.pool.query('SELECT COUNT(*) as count FROM medicamentos');
        const [dons] = await db_1.pool.query('SELECT COUNT(*) as count FROM donaciones');
        const [reqs] = await db_1.pool.query('SELECT COUNT(*) as count FROM solicitudes_clinicas');
        const [usrs] = await db_1.pool.query('SELECT COUNT(*) as count FROM usuarios');
        const [rols] = await db_1.pool.query('SELECT COUNT(*) as count FROM roles');
        const [viewsCountRaw] = await db_1.pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_schema = ?
    `, [env_1.ENV.DB_NAME]);
        const totalRecords = Number(meds[0].count) +
            Number(dons[0].count) +
            Number(reqs[0].count) +
            Number(usrs[0].count) +
            Number(rols[0].count);
        res.json({
            connected: true,
            engine: 'MySQL 8.0',
            host: `${env_1.ENV.DB_HOST}:${env_1.ENV.DB_PORT}`,
            database: env_1.ENV.DB_NAME,
            user: env_1.ENV.DB_USER,
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
    }
    catch (error) {
        console.error('Error al obtener estado de base de datos:', error);
        res.status(500).json({
            connected: false,
            error: 'Error al consultar métricas de MySQL',
            details: error?.message,
        });
    }
}
async function getDatabaseTables(req, res) {
    try {
        const [tablesRaw] = await db_1.pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ? AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `, [env_1.ENV.DB_NAME]);
        const summaries = [];
        const tableDescriptions = {
            medicamentos: { desc: 'Catálogo de medicamentos, principio activo, categoría y existencias', pk: 'id_medicamento' },
            donaciones: { desc: 'Registro de donaciones ciudadanas con lote, caducidad y estado sanitario', pk: 'id_donacion' },
            solicitudes_clinicas: { desc: 'Pedidos de fármacos solicitados por clínicas comunitarias', pk: 'id_solicitud' },
            usuarios: { desc: 'Cuentas de usuario registradas con rol asignado y credenciales', pk: 'id_usuario' },
            roles: { desc: 'Catálogo de permisos y perfiles (donante, clinica, administrador)', pk: 'id_rol' },
        };
        for (const t of tablesRaw) {
            const name = t.TABLE_NAME || t.table_name;
            const [countRows] = await db_1.pool.query(`SELECT COUNT(*) as count FROM ${name}`);
            const [colsRows] = await db_1.pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = ? AND table_name = ?
      `, [env_1.ENV.DB_NAME, name]);
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
            database: env_1.ENV.DB_NAME,
            count: summaries.length,
            tables: summaries,
        });
    }
    catch (error) {
        console.error('Error al listar tablas de MySQL:', error);
        res.status(500).json({ error: 'Error al obtener tablas de MySQL', details: error?.message });
    }
}
async function getDatabaseViews(req, res) {
    try {
        const [viewsRaw] = await db_1.pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = ?
      ORDER BY table_name ASC
    `, [env_1.ENV.DB_NAME]);
        const viewDescriptions = {
            vista_medicamentos_disponibles: 'Catálogo activo con cálculo automático de nivel y semáforo de inventario (Crítico/Bajo/Óptimo)',
            vista_donaciones_detalle: 'Trazabilidad completa de donaciones uniendo donantes y especificaciones de fármacos',
            vista_solicitudes_clinicas_detalle: 'Pedidos clínicos asociados con la clínica y existencia actual en almacén',
            vista_usuarios_roles: 'Cuentas de usuarios con su nombre de rol asignado (donante, clínica, administrador)',
            vista_resumen_inventario_categoria: 'Agrupación y totales de fármacos e inventario por categoría terapéutica',
            vista_kpis_donaciones: 'Métricas e indicadores consolidados de donaciones según su estado de trámite',
        };
        const summaries = [];
        for (const v of viewsRaw) {
            const name = v.TABLE_NAME || v.table_name;
            let count = 0;
            try {
                const [c] = await db_1.pool.query(`SELECT COUNT(*) as count FROM ${name}`);
                count = Number(c[0]?.count) || 0;
            }
            catch (_) { }
            const [colsRows] = await db_1.pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = ? AND table_name = ?
        ORDER BY ordinal_position ASC
      `, [env_1.ENV.DB_NAME, name]);
            const cols = colsRows.map((col) => col.COLUMN_NAME || col.column_name);
            summaries.push({
                name,
                rowCount: count,
                columnsCount: cols.length,
                columns: cols,
                description: viewDescriptions[name] || 'Vista relacional SQL de MediShare',
            });
        }
        res.json({
            database: env_1.ENV.DB_NAME,
            count: summaries.length,
            views: summaries,
        });
    }
    catch (error) {
        console.error('Error al listar vistas de MySQL:', error);
        res.status(500).json({ error: 'Error al obtener vistas de MySQL', details: error?.message });
    }
}
