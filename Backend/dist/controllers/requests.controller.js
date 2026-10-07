"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRequests = listRequests;
exports.createRequest = createRequest;
exports.updateRequest = updateRequest;
exports.deleteRequest = deleteRequest;
const db_1 = require("../config/db");
function parseRequestId(idStr) {
    const digits = idStr.replace(/\D/g, '');
    const parsed = parseInt(digits || idStr, 10);
    return isNaN(parsed) ? null : parsed;
}
function formatRequestStatus(raw) {
    const s = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (s.includes('aprob'))
        return 'Aprobada';
    if (s.includes('entreg'))
        return 'Entregada';
    if (s.includes('camino'))
        return 'En camino';
    return 'Pendiente';
}
function formatPresentation(raw) {
    const s = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (s.includes('capsul'))
        return 'Cápsulas';
    if (s.includes('jarabe'))
        return 'Jarabe';
    if (s.includes('gota'))
        return 'Gotas';
    if (s.includes('inyect'))
        return 'Inyectable';
    if (s.includes('inhal'))
        return 'Inhalador';
    if (s.includes('pomada') || s.includes('gel'))
        return 'Pomada / Gel';
    return 'Tabletas';
}
function capitalizeWords(str) {
    if (!str)
        return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}
async function listRequests(req, res) {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT s.id_solicitud, s.id_clinica, s.id_medicamento, s.cantidad_solicitada,
             s.estado_solicitud, s.fecha_solicitud,
             u.nombre AS clinicName,
             m.nombre_comercial AS commercialName,
             m.principio_activo AS activeIngredient,
             m.presentacion AS presentation
      FROM solicitudes_clinicas s
      LEFT JOIN usuarios u ON s.id_clinica = u.id_usuario
      LEFT JOIN medicamentos m ON s.id_medicamento = m.id_medicamento
      ORDER BY s.id_solicitud DESC
    `);
        const requests = rows.map((s) => ({
            id: `SOL-${String(s.id_solicitud).padStart(3, '0')}`,
            clinicName: capitalizeWords(s.clinicName || 'Clínica Comunitaria'),
            activeIngredient: capitalizeWords(s.activeIngredient || s.commercialName || 'Medicamento general'),
            presentation: formatPresentation(s.presentation),
            requestedUnits: Number(s.cantidad_solicitada) || 0,
            requestDate: s.fecha_solicitud ? new Date(s.fecha_solicitud).toISOString().split('T')[0] : '2026-01-01',
            urgency: 'Media',
            status: formatRequestStatus(s.estado_solicitud),
        }));
        res.json({ count: requests.length, requests });
    }
    catch (error) {
        console.error('Error al listar solicitudes clínicas en MySQL:', error);
        res.status(500).json({ error: 'Error al consultar solicitudes en base de datos SQL', details: error?.message });
    }
}
async function createRequest(req, res) {
    const { catalogItemId, clinicName, requestedUnits, urgency, activeIngredient, presentation } = req.body;
    const units = Number(requestedUnits) || 1;
    const clinName = (clinicName || 'Clínica Esperanza').trim();
    try {
        // 1. Resolver clínica
        let clinicId = 3;
        const [userRows] = await db_1.pool.query('SELECT id_usuario FROM usuarios WHERE LOWER(nombre) = ? LIMIT 1', [clinName.toLowerCase()]);
        if (userRows.length > 0) {
            clinicId = userRows[0].id_usuario;
        }
        else {
            const [insertUser] = await db_1.pool.query('INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, 2)', [clinName, `${clinName.toLowerCase().replace(/\s+/g, '')}@esperanza.com`, '123456']);
            clinicId = insertUser.insertId;
        }
        // 2. Resolver medicamento
        let medId = 1;
        let medActive = activeIngredient || 'Medicamento general';
        let medPres = presentation || 'Tabletas';
        if (catalogItemId) {
            const parsedCatId = parseRequestId(catalogItemId);
            if (parsedCatId) {
                const [medRows] = await db_1.pool.query('SELECT * FROM medicamentos WHERE id_medicamento = ?', [parsedCatId]);
                if (medRows.length > 0) {
                    medId = medRows[0].id_medicamento;
                    medActive = medRows[0].principio_activo;
                    medPres = medRows[0].presentacion;
                }
            }
        }
        else if (activeIngredient) {
            const [medRows] = await db_1.pool.query('SELECT * FROM medicamentos WHERE LOWER(principio_activo) = ? OR LOWER(nombre_comercial) = ? LIMIT 1', [activeIngredient.trim().toLowerCase(), activeIngredient.trim().toLowerCase()]);
            if (medRows.length > 0) {
                medId = medRows[0].id_medicamento;
                medActive = medRows[0].principio_activo;
                medPres = medRows[0].presentacion;
            }
        }
        // Descontar inventario disponible si hay suficiente stock
        await db_1.pool.query('UPDATE medicamentos SET stock_total = GREATEST(0, stock_total - ?) WHERE id_medicamento = ?', [units, medId]);
        // Insertar solicitud en MySQL
        const estado = 'Aprobada';
        const [resReq] = await db_1.pool.query('INSERT INTO solicitudes_clinicas (id_clinica, id_medicamento, cantidad_solicitada, estado_solicitud) VALUES (?, ?, ?, ?)', [clinicId, medId, units, estado]);
        const insertedId = resReq.insertId;
        const newRequest = {
            id: `SOL-${String(insertedId).padStart(3, '0')}`,
            clinicName: clinName,
            activeIngredient: medActive,
            presentation: medPres,
            requestedUnits: units,
            requestDate: new Date().toISOString().split('T')[0],
            urgency: urgency || 'Media',
            status: estado,
        };
        res.status(201).json({
            message: `Solicitud de ${units} unidades de ${medActive} registrada en MySQL para ${clinName}.`,
            request: newRequest,
        });
    }
    catch (error) {
        console.error('Error al insertar solicitud clínica en MySQL:', error);
        res.status(500).json({ error: 'Error al registrar solicitud en base de datos', details: error?.message });
    }
}
async function updateRequest(req, res) {
    const { id } = req.params;
    const numId = parseRequestId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de solicitud clínica inválido' });
        return;
    }
    try {
        const [existing] = await db_1.pool.query(`SELECT s.*, u.nombre AS clinicName, m.principio_activo, m.presentacion
       FROM solicitudes_clinicas s
       LEFT JOIN usuarios u ON s.id_clinica = u.id_usuario
       LEFT JOIN medicamentos m ON s.id_medicamento = m.id_medicamento
       WHERE s.id_solicitud = ?`, [numId]);
        if (existing.length === 0) {
            res.status(404).json({ error: 'Solicitud clínica no encontrada' });
            return;
        }
        const cur = existing[0];
        const newStatus = req.body.status !== undefined ? req.body.status : (req.body.estado_solicitud || cur.estado_solicitud);
        const newUnits = req.body.requestedUnits !== undefined ? Number(req.body.requestedUnits) : (req.body.cantidad_solicitada !== undefined ? Number(req.body.cantidad_solicitada) : cur.cantidad_solicitada);
        await db_1.pool.query('UPDATE solicitudes_clinicas SET estado_solicitud = ?, cantidad_solicitada = ? WHERE id_solicitud = ?', [newStatus, newUnits, numId]);
        // Actualizar nombre de clínica si fue editado
        if (req.body.clinicName && cur.id_clinica) {
            await db_1.pool.query('UPDATE usuarios SET nombre = ? WHERE id_usuario = ?', [req.body.clinicName.trim(), cur.id_clinica]);
        }
        // Actualizar fármaco si fue editado
        if (req.body.activeIngredient && cur.id_medicamento) {
            await db_1.pool.query('UPDATE medicamentos SET principio_activo = ? WHERE id_medicamento = ?', [req.body.activeIngredient.trim(), cur.id_medicamento]);
        }
        const updatedRequest = {
            id: `SOL-${String(numId).padStart(3, '0')}`,
            clinicName: req.body.clinicName || cur.clinicName || 'Clínica Comunitaria',
            activeIngredient: req.body.activeIngredient || cur.principio_activo || 'Medicamento general',
            presentation: (req.body.presentation || cur.presentacion || 'Tabletas'),
            requestedUnits: newUnits,
            requestDate: cur.fecha_solicitud ? new Date(cur.fecha_solicitud).toISOString().split('T')[0] : '2026-01-01',
            urgency: req.body.urgency || 'Media',
            status: newStatus,
        };
        res.json({ message: 'Solicitud clínica actualizada con éxito en MySQL', request: updatedRequest });
    }
    catch (error) {
        console.error('Error al actualizar solicitud clínica en MySQL:', error);
        res.status(500).json({ error: 'Error al actualizar solicitud en base de datos', details: error?.message });
    }
}
async function deleteRequest(req, res) {
    const { id } = req.params;
    const numId = parseRequestId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de solicitud clínica inválido' });
        return;
    }
    try {
        const [existing] = await db_1.pool.query('SELECT * FROM solicitudes_clinicas WHERE id_solicitud = ?', [numId]);
        if (existing.length === 0) {
            res.status(404).json({ error: 'Solicitud clínica no encontrada' });
            return;
        }
        await db_1.pool.query('DELETE FROM solicitudes_clinicas WHERE id_solicitud = ?', [numId]);
        res.json({ message: 'Solicitud clínica eliminada de MySQL', id });
    }
    catch (error) {
        console.error('Error al eliminar solicitud clínica en MySQL:', error);
        res.status(500).json({ error: 'Error al eliminar solicitud en base de datos', details: error?.message });
    }
}
