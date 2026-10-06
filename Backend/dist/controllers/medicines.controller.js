"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMedicines = listMedicines;
exports.getMedicineById = getMedicineById;
exports.createMedicine = createMedicine;
exports.updateMedicine = updateMedicine;
exports.deleteMedicine = deleteMedicine;
const db_1 = require("../config/db");
function parseMedicineId(idStr) {
    const digits = idStr.replace(/\D/g, '');
    const parsed = parseInt(digits || idStr, 10);
    return isNaN(parsed) ? null : parsed;
}
async function listMedicines(req, res) {
    const { q, category } = req.query;
    try {
        let sql = 'SELECT * FROM medicamentos WHERE 1=1';
        const params = [];
        if (category && category !== 'Todos') {
            sql += ' AND LOWER(categoria) = LOWER(?)';
            params.push(String(category).trim());
        }
        if (q) {
            const query = `%${String(q).trim().toLowerCase()}%`;
            sql += ' AND (LOWER(principio_activo) LIKE ? OR LOWER(nombre_comercial) LIKE ?)';
            params.push(query, query);
        }
        sql += ' ORDER BY id_medicamento ASC';
        const [rows] = await db_1.pool.query(sql, params);
        const medicines = rows.map((m) => ({
            id: `CAT-${String(m.id_medicamento).padStart(3, '0')}`,
            activeIngredient: m.principio_activo,
            commercialName: m.nombre_comercial,
            presentation: m.presentacion,
            category: m.categoria,
            availableUnits: Number(m.stock_total) || 0,
            minExpirationDate: '2027-06-30',
            batchNumber: `LOT-${String(m.id_medicamento).padStart(3, '0')}-2026`,
            isHighDemand: m.estado === 'alta demanda',
            location: 'Centro de Acopio Central',
        }));
        res.json({ count: medicines.length, medicines });
    }
    catch (error) {
        console.error('Error al consultar medicamentos en MySQL:', error);
        res.status(500).json({ error: 'Error al consultar catálogo en la base de datos SQL', details: error?.message });
    }
}
async function getMedicineById(req, res) {
    const { id } = req.params;
    const numId = parseMedicineId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de medicamento inválido' });
        return;
    }
    try {
        const [rows] = await db_1.pool.query('SELECT * FROM medicamentos WHERE id_medicamento = ?', [numId]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Medicamento no encontrado en el catálogo' });
            return;
        }
        const m = rows[0];
        const medicine = {
            id: `CAT-${String(m.id_medicamento).padStart(3, '0')}`,
            activeIngredient: m.principio_activo,
            commercialName: m.nombre_comercial,
            presentation: m.presentacion,
            category: m.categoria,
            availableUnits: Number(m.stock_total) || 0,
            minExpirationDate: '2027-06-30',
            batchNumber: `LOT-${String(m.id_medicamento).padStart(3, '0')}-2026`,
            isHighDemand: m.estado === 'alta demanda',
            location: 'Centro de Acopio Central',
        };
        res.json({ medicine });
    }
    catch (error) {
        console.error('Error al obtener medicamento por ID en MySQL:', error);
        res.status(500).json({ error: 'Error en la base de datos SQL', details: error?.message });
    }
}
async function createMedicine(req, res) {
    const { activeIngredient, commercialName, presentation, category, availableUnits, isHighDemand, estado } = req.body;
    if (!activeIngredient || !commercialName || !presentation || !category) {
        res.status(400).json({ error: 'Campos requeridos incompletos para crear medicamento' });
        return;
    }
    const stock = Number(availableUnits) || 0;
    const estadoFinal = estado || (isHighDemand ? 'alta demanda' : 'en línea');
    try {
        const [result] = await db_1.pool.query('INSERT INTO medicamentos (nombre_comercial, principio_activo, presentacion, categoria, stock_total, estado) VALUES (?, ?, ?, ?, ?, ?)', [commercialName.trim(), activeIngredient.trim(), presentation.trim(), category.trim(), stock, estadoFinal]);
        const insertedId = result.insertId;
        const newMedicine = {
            id: `CAT-${String(insertedId).padStart(3, '0')}`,
            activeIngredient: activeIngredient.trim(),
            commercialName: commercialName.trim(),
            presentation,
            category,
            availableUnits: stock,
            minExpirationDate: req.body.minExpirationDate || '2027-06-30',
            batchNumber: req.body.batchNumber || `LOT-${String(insertedId).padStart(3, '0')}-2026`,
            isHighDemand: Boolean(isHighDemand || estadoFinal === 'alta demanda'),
            location: 'Centro de Acopio Central',
        };
        res.status(201).json({ message: 'Medicamento guardado con éxito en MySQL', medicine: newMedicine });
    }
    catch (error) {
        console.error('Error al insertar medicamento en MySQL:', error);
        res.status(500).json({ error: 'Error al registrar medicamento en base de datos', details: error?.message });
    }
}
async function updateMedicine(req, res) {
    const { id } = req.params;
    const numId = parseMedicineId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de medicamento inválido' });
        return;
    }
    try {
        const [existing] = await db_1.pool.query('SELECT * FROM medicamentos WHERE id_medicamento = ?', [numId]);
        if (existing.length === 0) {
            res.status(404).json({ error: 'Medicamento no encontrado' });
            return;
        }
        const current = existing[0];
        const commercialName = req.body.commercialName !== undefined ? req.body.commercialName.trim() : current.nombre_comercial;
        const activeIngredient = req.body.activeIngredient !== undefined ? req.body.activeIngredient.trim() : current.principio_activo;
        const presentation = req.body.presentation !== undefined ? req.body.presentation.trim() : current.presentacion;
        const category = req.body.category !== undefined ? req.body.category.trim() : current.categoria;
        const stock = req.body.availableUnits !== undefined ? Number(req.body.availableUnits) : current.stock_total;
        const estado = req.body.estado !== undefined ? req.body.estado : (req.body.isHighDemand !== undefined ? (req.body.isHighDemand ? 'alta demanda' : 'en línea') : current.estado);
        await db_1.pool.query('UPDATE medicamentos SET nombre_comercial = ?, principio_activo = ?, presentacion = ?, categoria = ?, stock_total = ?, estado = ? WHERE id_medicamento = ?', [commercialName, activeIngredient, presentation, category, stock, estado, numId]);
        const updatedMedicine = {
            id: `CAT-${String(numId).padStart(3, '0')}`,
            activeIngredient,
            commercialName,
            presentation,
            category,
            availableUnits: stock,
            minExpirationDate: req.body.minExpirationDate || '2027-06-30',
            batchNumber: req.body.batchNumber || `LOT-${String(numId).padStart(3, '0')}-2026`,
            isHighDemand: estado === 'alta demanda',
            location: 'Centro de Acopio Central',
        };
        res.json({ message: 'Medicamento actualizado con éxito en MySQL', medicine: updatedMedicine });
    }
    catch (error) {
        console.error('Error al actualizar medicamento en MySQL:', error);
        res.status(500).json({ error: 'Error al actualizar medicamento en base de datos', details: error?.message });
    }
}
async function deleteMedicine(req, res) {
    const { id } = req.params;
    const numId = parseMedicineId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de medicamento inválido' });
        return;
    }
    try {
        const [existing] = await db_1.pool.query('SELECT * FROM medicamentos WHERE id_medicamento = ?', [numId]);
        if (existing.length === 0) {
            res.status(404).json({ error: 'Medicamento no encontrado' });
            return;
        }
        // Limpiar claves foráneas dependientes
        await db_1.pool.query('DELETE FROM solicitudes_clinicas WHERE id_medicamento = ?', [numId]);
        await db_1.pool.query('DELETE FROM donaciones WHERE id_medicamento = ?', [numId]);
        await db_1.pool.query('DELETE FROM medicamentos WHERE id_medicamento = ?', [numId]);
        res.json({ message: 'Medicamento eliminado del catálogo en MySQL', id });
    }
    catch (error) {
        console.error('Error al eliminar medicamento en MySQL:', error);
        res.status(500).json({ error: 'Error al eliminar medicamento en base de datos', details: error?.message });
    }
}
