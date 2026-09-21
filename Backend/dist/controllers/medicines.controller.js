"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMedicines = listMedicines;
exports.getMedicineById = getMedicineById;
exports.createMedicine = createMedicine;
exports.updateMedicine = updateMedicine;
exports.deleteMedicine = deleteMedicine;
const store_1 = require("../models/store");
function listMedicines(req, res) {
    const { q, category } = req.query;
    let results = [...store_1.MemoryStore.medicines];
    if (category && category !== 'Todos') {
        results = results.filter((m) => m.category.toLowerCase() === category.toLowerCase());
    }
    if (q) {
        const query = q.toLowerCase().trim();
        results = results.filter((m) => m.activeIngredient.toLowerCase().includes(query) ||
            m.commercialName.toLowerCase().includes(query) ||
            m.batchNumber.toLowerCase().includes(query));
    }
    res.json({ count: results.length, medicines: results });
}
function getMedicineById(req, res) {
    const { id } = req.params;
    const medicine = store_1.MemoryStore.medicines.find((m) => m.id === id);
    if (!medicine) {
        res.status(404).json({ error: 'Medicamento no encontrado en el catálogo' });
        return;
    }
    res.json({ medicine });
}
function createMedicine(req, res) {
    const { activeIngredient, commercialName, presentation, category, availableUnits, minExpirationDate, batchNumber, isHighDemand } = req.body;
    if (!activeIngredient || !commercialName || !presentation || !category) {
        res.status(400).json({ error: 'Campos requeridos incompletos para crear medicamento' });
        return;
    }
    const nextId = `CAT-${(store_1.MemoryStore.medicines.length + 1).toString().padStart(3, '0')}`;
    const newMedicine = {
        id: nextId,
        activeIngredient,
        commercialName,
        presentation,
        category,
        availableUnits: Number(availableUnits) || 0,
        minExpirationDate: minExpirationDate || '2027-01-01',
        batchNumber: batchNumber || `LOT-${Math.floor(Math.random() * 900 + 100)}`,
        isHighDemand: Boolean(isHighDemand),
        location: 'Centro de Acopio Central',
    };
    store_1.MemoryStore.medicines.unshift(newMedicine);
    res.status(201).json({ message: 'Medicamento agregado al catálogo', medicine: newMedicine });
}
function updateMedicine(req, res) {
    const { id } = req.params;
    const index = store_1.MemoryStore.medicines.findIndex((m) => m.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Medicamento no encontrado' });
        return;
    }
    store_1.MemoryStore.medicines[index] = {
        ...store_1.MemoryStore.medicines[index],
        ...req.body,
        id, // Mantener inmutable el ID
    };
    res.json({ message: 'Medicamento actualizado con éxito', medicine: store_1.MemoryStore.medicines[index] });
}
function deleteMedicine(req, res) {
    const { id } = req.params;
    const index = store_1.MemoryStore.medicines.findIndex((m) => m.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Medicamento no encontrado' });
        return;
    }
    const removed = store_1.MemoryStore.medicines.splice(index, 1)[0];
    res.json({ message: 'Medicamento eliminado del catálogo', medicine: removed });
}
