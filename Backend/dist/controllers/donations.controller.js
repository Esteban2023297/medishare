"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDonations = listDonations;
exports.createDonation = createDonation;
exports.updateDonation = updateDonation;
exports.deleteDonation = deleteDonation;
const db_1 = require("../config/db");
function parseDonationId(idStr) {
    const digits = idStr.replace(/\D/g, '');
    const parsed = parseInt(digits || idStr, 10);
    return isNaN(parsed) ? null : parsed;
}
function formatDonationStatus(raw) {
    const s = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (s.includes('aprob'))
        return 'Aprobado';
    if (s.includes('entreg'))
        return 'Entregado';
    if (s.includes('revis'))
        return 'En revisión';
    if (s.includes('rechaz'))
        return 'Rechazado';
    return 'Pendiente';
}
function formatCategory(raw) {
    const s = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (s.includes('antibiot'))
        return 'Antibióticos';
    if (s.includes('diabet'))
        return 'Diabetes';
    if (s.includes('cardio'))
        return 'Cardio';
    if (s.includes('analges') || s.includes('antiinflam'))
        return 'Analgésicos';
    if (s.includes('respirat'))
        return 'Respiratorio';
    if (s.includes('gastro'))
        return 'Gastrointestinal';
    return 'Otros';
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
async function listDonations(req, res) {
    const { status, donorName } = req.query;
    try {
        let sql = `
      SELECT d.id_donacion, d.id_usuario, d.id_medicamento, d.numero_lote, d.cantidad_unidades,
             d.fecha_caducidad, d.observaciones, d.estado_tramite, d.fecha_donacion,
             u.nombre AS donorName,
             m.nombre_comercial AS commercialName,
             m.principio_activo AS activeIngredient,
             m.presentacion AS presentation,
             m.categoria AS category
      FROM donaciones d
      LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
      LEFT JOIN medicamentos m ON d.id_medicamento = m.id_medicamento
      WHERE 1=1
    `;
        const params = [];
        if (status && status !== 'Todos') {
            sql += ' AND LOWER(d.estado_tramite) LIKE ?';
            params.push(`%${String(status).trim().toLowerCase().slice(0, 5)}%`);
        }
        if (donorName) {
            sql += ' AND LOWER(u.nombre) LIKE ?';
            params.push(`%${String(donorName).trim().toLowerCase()}%`);
        }
        sql += ' ORDER BY d.id_donacion DESC';
        const [rows] = await db_1.pool.query(sql, params);
        const donations = rows.map((d) => ({
            id: `DON-${String(d.id_donacion).padStart(3, '0')}`,
            commercialName: capitalizeWords(d.commercialName || 'Medicamento'),
            activeIngredient: capitalizeWords(d.activeIngredient || 'Principio activo'),
            category: formatCategory(d.category),
            presentation: formatPresentation(d.presentation),
            batchNumber: (d.numero_lote || 'LOT-2026').toUpperCase(),
            units: Number(d.cantidad_unidades) || 0,
            expirationDate: d.fecha_caducidad ? new Date(d.fecha_caducidad).toISOString().split('T')[0] : '2027-01-01',
            status: formatDonationStatus(d.estado_tramite),
            donorName: capitalizeWords(d.donorName || 'Donante MediShare'),
            donorNotes: d.observaciones || '',
            targetClinic: '',
            createdAt: d.fecha_donacion ? new Date(d.fecha_donacion).toISOString().split('T')[0] : '2026-01-01',
        }));
        res.json({ count: donations.length, donations });
    }
    catch (error) {
        console.error('Error al consultar donaciones en MySQL:', error);
        res.status(500).json({ error: 'Error al consultar donaciones en base de datos SQL', details: error?.message });
    }
}
async function createDonation(req, res) {
    const { commercialName, activeIngredient, category, presentation, batchNumber, units, expirationDate, donorNotes, targetClinic, donorName, status } = req.body;
    if (!commercialName || !activeIngredient || !presentation || !units || !expirationDate) {
        res.status(400).json({ error: 'Campos requeridos incompletos para registrar donación' });
        return;
    }
    const numUnits = Number(units) || 1;
    const effectiveDonorName = donorName || req.user?.name || 'María Rodríguez';
    try {
        // 1. Obtener o insertar usuario donante
        let userId = 1;
        const [userRows] = await db_1.pool.query('SELECT id_usuario FROM usuarios WHERE LOWER(nombre) = ? LIMIT 1', [effectiveDonorName.trim().toLowerCase()]);
        if (userRows.length > 0) {
            userId = userRows[0].id_usuario;
        }
        else {
            const [allUsers] = await db_1.pool.query('SELECT id_usuario FROM usuarios LIMIT 1');
            if (allUsers.length > 0)
                userId = allUsers[0].id_usuario;
        }
        // 2. Obtener o crear medicamento en catálogo
        let medId = 1;
        const [medRows] = await db_1.pool.query('SELECT id_medicamento FROM medicamentos WHERE LOWER(nombre_comercial) = ? OR LOWER(principio_activo) = ? LIMIT 1', [commercialName.trim().toLowerCase(), activeIngredient.trim().toLowerCase()]);
        if (medRows.length > 0) {
            medId = medRows[0].id_medicamento;
            // Actualizar stock existente
            await db_1.pool.query('UPDATE medicamentos SET stock_total = stock_total + ? WHERE id_medicamento = ?', [numUnits, medId]);
        }
        else {
            const [newMed] = await db_1.pool.query('INSERT INTO medicamentos (nombre_comercial, principio_activo, presentacion, categoria, stock_total, estado) VALUES (?, ?, ?, ?, ?, ?)', [commercialName.trim(), activeIngredient.trim(), presentation.trim(), (category || 'Analgésicos').trim(), numUnits, 'en línea']);
            medId = newMed.insertId;
        }
        // 3. Insertar donación en MySQL
        const estado = status || 'Pendiente';
        const notas = donorNotes || (targetClinic ? `Destino asignado: ${targetClinic}` : '');
        const [resDon] = await db_1.pool.query('INSERT INTO donaciones (id_usuario, id_medicamento, numero_lote, cantidad_unidades, fecha_caducidad, observaciones, estado_tramite) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, medId, (batchNumber || 'LOT-2026').toUpperCase().trim(), numUnits, expirationDate, notas, estado]);
        const insertedId = resDon.insertId;
        const newDonation = {
            id: `DON-${String(insertedId).padStart(3, '0')}`,
            commercialName: commercialName.trim(),
            activeIngredient: activeIngredient.trim(),
            category: category || 'Analgésicos',
            presentation,
            batchNumber: (batchNumber || 'LOT-2026').toUpperCase().trim(),
            units: numUnits,
            expirationDate,
            status: estado,
            donorName: effectiveDonorName,
            donorNotes: notas,
            targetClinic: targetClinic || undefined,
            createdAt: new Date().toISOString().split('T')[0],
        };
        res.status(201).json({
            message: 'Donación registrada con éxito en MySQL',
            donation: newDonation,
        });
    }
    catch (error) {
        console.error('Error al insertar donación en MySQL:', error);
        res.status(500).json({ error: 'Error al registrar donación en base de datos', details: error?.message });
    }
}
async function updateDonation(req, res) {
    const { id } = req.params;
    const numId = parseDonationId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de donación inválido' });
        return;
    }
    try {
        const [existing] = await db_1.pool.query(`SELECT d.*, m.id_medicamento, m.nombre_comercial, m.principio_activo, m.presentacion, m.categoria, u.nombre as donorName
       FROM donaciones d
       LEFT JOIN medicamentos m ON d.id_medicamento = m.id_medicamento
       LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
       WHERE d.id_donacion = ?`, [numId]);
        if (existing.length === 0) {
            res.status(404).json({ error: 'Donación no encontrada' });
            return;
        }
        const cur = existing[0];
        const newStatus = req.body.status !== undefined ? req.body.status : (req.body.estado_tramite || cur.estado_tramite);
        const newUnits = req.body.units !== undefined ? Number(req.body.units) : (req.body.cantidad_unidades ? Number(req.body.cantidad_unidades) : cur.cantidad_unidades);
        const newBatch = req.body.batchNumber !== undefined ? req.body.batchNumber : (req.body.numero_lote || cur.numero_lote);
        const newExp = req.body.expirationDate !== undefined ? req.body.expirationDate : (cur.fecha_caducidad ? new Date(cur.fecha_caducidad).toISOString().split('T')[0] : '2027-01-01');
        const newObs = req.body.donorNotes !== undefined ? req.body.donorNotes : (req.body.observaciones !== undefined ? req.body.observaciones : cur.observaciones);
        await db_1.pool.query('UPDATE donaciones SET estado_tramite = ?, cantidad_unidades = ?, numero_lote = ?, fecha_caducidad = ?, observaciones = ? WHERE id_donacion = ?', [newStatus, newUnits, newBatch, newExp, newObs, numId]);
        // Actualizar nombre comercial / principio activo en tabla de medicamentos si vino en el body
        if (cur.id_medicamento && (req.body.commercialName || req.body.activeIngredient || req.body.presentation || req.body.category)) {
            const comm = req.body.commercialName || cur.nombre_comercial;
            const act = req.body.activeIngredient || cur.principio_activo;
            const pres = req.body.presentation || cur.presentacion;
            const cat = req.body.category || cur.categoria;
            await db_1.pool.query('UPDATE medicamentos SET nombre_comercial = ?, principio_activo = ?, presentacion = ?, categoria = ? WHERE id_medicamento = ?', [comm, act, pres, cat, cur.id_medicamento]);
        }
        const updatedDonation = {
            id: `DON-${String(numId).padStart(3, '0')}`,
            commercialName: req.body.commercialName || cur.nombre_comercial || 'Medicamento',
            activeIngredient: req.body.activeIngredient || cur.principio_activo || 'Principio activo',
            category: (req.body.category || cur.categoria || 'Analgésicos'),
            presentation: (req.body.presentation || cur.presentacion || 'Tabletas'),
            batchNumber: newBatch,
            units: newUnits,
            expirationDate: newExp,
            status: newStatus,
            donorName: cur.donorName || 'Donante MediShare',
            donorNotes: newObs,
            targetClinic: req.body.targetClinic || '',
            createdAt: cur.fecha_donacion ? new Date(cur.fecha_donacion).toISOString().split('T')[0] : '2026-01-01',
        };
        res.json({ message: 'Donación actualizada con éxito en MySQL', donation: updatedDonation });
    }
    catch (error) {
        console.error('Error al actualizar donación en MySQL:', error);
        res.status(500).json({ error: 'Error al actualizar donación en base de datos', details: error?.message });
    }
}
async function deleteDonation(req, res) {
    const { id } = req.params;
    const numId = parseDonationId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de donación inválido' });
        return;
    }
    try {
        const [existing] = await db_1.pool.query('SELECT * FROM donaciones WHERE id_donacion = ?', [numId]);
        if (existing.length === 0) {
            res.status(404).json({ error: 'Donación no encontrada' });
            return;
        }
        await db_1.pool.query('DELETE FROM donaciones WHERE id_donacion = ?', [numId]);
        res.json({ message: 'Donación eliminada exitosamente de MySQL', id });
    }
    catch (error) {
        console.error('Error al eliminar donación en MySQL:', error);
        res.status(500).json({ error: 'Error al eliminar donación en base de datos', details: error?.message });
    }
}
