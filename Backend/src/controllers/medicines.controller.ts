import { Request, Response } from 'express';
import { pool } from '../config/db';
import { MedicineCatalogItem, MedicineCategory, MedicinePresentation } from '../models/types';

function parseMedicineId(idStr: string): number | null {
  const digits = idStr.replace(/\D/g, '');
  const parsed = parseInt(digits || idStr, 10);
  return isNaN(parsed) ? null : parsed;
}

function formatCategory(raw: string): MedicineCategory {
  const s = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (s.includes('antibiot')) return 'Antibióticos';
  if (s.includes('diabet')) return 'Diabetes';
  if (s.includes('cardio')) return 'Cardio';
  if (s.includes('analges') || s.includes('antiinflam')) return 'Analgésicos';
  if (s.includes('respirat')) return 'Respiratorio';
  if (s.includes('gastro')) return 'Gastrointestinal';
  return 'Otros';
}

function formatPresentation(raw: string): MedicinePresentation {
  const s = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (s.includes('capsul')) return 'Cápsulas';
  if (s.includes('jarabe')) return 'Jarabe';
  if (s.includes('gota')) return 'Gotas';
  if (s.includes('inyect')) return 'Inyectable';
  if (s.includes('inhal')) return 'Inhalador';
  if (s.includes('pomada') || s.includes('gel')) return 'Pomada / Gel';
  return 'Tabletas';
}

function capitalizeWords(str: string): string {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export async function listMedicines(req: Request, res: Response): Promise<void> {
  const { q, category } = req.query;

  try {
    let sql = 'SELECT * FROM medicamentos WHERE 1=1';
    const params: any[] = [];

    if (category && category !== 'Todos') {
      sql += ' AND LOWER(categoria) LIKE ?';
      const catSearch = `%${String(category).trim().toLowerCase().slice(0, 5)}%`;
      params.push(catSearch);
    }

    if (q) {
      const query = `%${String(q).trim().toLowerCase()}%`;
      sql += ' AND (LOWER(principio_activo) LIKE ? OR LOWER(nombre_comercial) LIKE ?)';
      params.push(query, query);
    }

    sql += ' ORDER BY id_medicamento ASC';

    const [rows]: [any[], any] = await pool.query(sql, params);

    const medicines: MedicineCatalogItem[] = rows.map((m) => ({
      id: `CAT-${String(m.id_medicamento).padStart(3, '0')}`,
      activeIngredient: capitalizeWords(m.principio_activo),
      commercialName: capitalizeWords(m.nombre_comercial),
      presentation: formatPresentation(m.presentacion),
      category: formatCategory(m.categoria),
      availableUnits: Number(m.stock_total) || 0,
      minExpirationDate: '2027-06-30',
      batchNumber: `LOT-${String(m.id_medicamento).padStart(3, '0')}-2026`,
      isHighDemand: m.estado === 'alta demanda',
      location: 'Centro de Acopio Central',
    }));

    res.json({ count: medicines.length, medicines });
  } catch (error: any) {
    console.error('Error al consultar medicamentos en MySQL:', error);
    res.status(500).json({ error: 'Error al consultar catálogo en la base de datos SQL', details: error?.message });
  }
}

export async function getMedicineById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const numId = parseMedicineId(id);

  if (numId === null) {
    res.status(400).json({ error: 'ID de medicamento inválido' });
    return;
  }

  try {
    const [rows]: [any[], any] = await pool.query('SELECT * FROM medicamentos WHERE id_medicamento = ?', [numId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Medicamento no encontrado en el catálogo' });
      return;
    }

    const m = rows[0];
    const medicine: MedicineCatalogItem = {
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
  } catch (error: any) {
    console.error('Error al obtener medicamento por ID en MySQL:', error);
    res.status(500).json({ error: 'Error en la base de datos SQL', details: error?.message });
  }
}

export async function createMedicine(req: Request, res: Response): Promise<void> {
  const { activeIngredient, commercialName, presentation, category, availableUnits, isHighDemand, estado } = req.body;

  if (!activeIngredient || !commercialName || !presentation || !category) {
    res.status(400).json({ error: 'Campos requeridos incompletos para crear medicamento' });
    return;
  }

  const stock = Number(availableUnits) || 0;
  const estadoFinal = estado || (isHighDemand ? 'alta demanda' : 'en línea');

  try {
    const [result]: any = await pool.query(
      'INSERT INTO medicamentos (nombre_comercial, principio_activo, presentacion, categoria, stock_total, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [commercialName.trim(), activeIngredient.trim(), presentation.trim(), category.trim(), stock, estadoFinal]
    );

    const insertedId = result.insertId;
    const newMedicine: MedicineCatalogItem = {
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
  } catch (error: any) {
    console.error('Error al insertar medicamento en MySQL:', error);
    res.status(500).json({ error: 'Error al registrar medicamento en base de datos', details: error?.message });
  }
}

export async function updateMedicine(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const numId = parseMedicineId(id);

  if (numId === null) {
    res.status(400).json({ error: 'ID de medicamento inválido' });
    return;
  }

  try {
    const [existing]: [any[], any] = await pool.query('SELECT * FROM medicamentos WHERE id_medicamento = ?', [numId]);
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

    await pool.query(
      'UPDATE medicamentos SET nombre_comercial = ?, principio_activo = ?, presentacion = ?, categoria = ?, stock_total = ?, estado = ? WHERE id_medicamento = ?',
      [commercialName, activeIngredient, presentation, category, stock, estado, numId]
    );

    const updatedMedicine: MedicineCatalogItem = {
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
  } catch (error: any) {
    console.error('Error al actualizar medicamento en MySQL:', error);
    res.status(500).json({ error: 'Error al actualizar medicamento en base de datos', details: error?.message });
  }
}

export async function deleteMedicine(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const numId = parseMedicineId(id);

  if (numId === null) {
    res.status(400).json({ error: 'ID de medicamento inválido' });
    return;
  }

  try {
    const [existing]: [any[], any] = await pool.query('SELECT * FROM medicamentos WHERE id_medicamento = ?', [numId]);
    if (existing.length === 0) {
      res.status(404).json({ error: 'Medicamento no encontrado' });
      return;
    }

    // Limpiar claves foráneas dependientes
    await pool.query('DELETE FROM solicitudes_clinicas WHERE id_medicamento = ?', [numId]);
    await pool.query('DELETE FROM donaciones WHERE id_medicamento = ?', [numId]);
    await pool.query('DELETE FROM medicamentos WHERE id_medicamento = ?', [numId]);

    res.json({ message: 'Medicamento eliminado del catálogo en MySQL', id });
  } catch (error: any) {
    console.error('Error al eliminar medicamento en MySQL:', error);
    res.status(500).json({ error: 'Error al eliminar medicamento en base de datos', details: error?.message });
  }
}
