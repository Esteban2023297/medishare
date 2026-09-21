"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listDonations = listDonations;
exports.createDonation = createDonation;
exports.updateDonation = updateDonation;
exports.deleteDonation = deleteDonation;
const store_1 = require("../models/store");
function listDonations(req, res) {
    const { status, donorName } = req.query;
    let results = [...store_1.MemoryStore.donations];
    if (status && status !== 'Todos') {
        results = results.filter((d) => d.status.toLowerCase() === status.toLowerCase());
    }
    if (donorName) {
        results = results.filter((d) => d.donorName.toLowerCase().includes(donorName.toLowerCase()));
    }
    res.json({ count: results.length, donations: results });
}
function createDonation(req, res) {
    const { commercialName, activeIngredient, category, presentation, batchNumber, units, expirationDate, donorNotes, targetClinic } = req.body;
    if (!commercialName || !activeIngredient || !presentation || !units || !expirationDate) {
        res.status(400).json({ error: 'Campos requeridos incompletos para registrar donación' });
        return;
    }
    const donorName = req.user?.name || req.body.donorName || 'María Rodríguez';
    const nextId = `DON-${(store_1.MemoryStore.donations.length + 1).toString().padStart(3, '0')}`;
    const newDonation = {
        id: nextId,
        commercialName,
        activeIngredient,
        category: category || 'Analgésicos',
        presentation,
        batchNumber: (batchNumber || 'LOT-2026').toUpperCase().trim(),
        units: Number(units),
        expirationDate,
        status: 'Pendiente',
        donorName,
        donorNotes: donorNotes || '',
        targetClinic: targetClinic || undefined,
        createdAt: new Date().toISOString().split('T')[0],
    };
    store_1.MemoryStore.donations.unshift(newDonation);
    store_1.MemoryStore.metrics.medicinesSaved += Number(units);
    res.status(201).json({
        message: 'Donación aprobada sanitariamente y registrada en MediShare',
        donation: newDonation,
    });
}
function updateDonation(req, res) {
    const { id } = req.params;
    const index = store_1.MemoryStore.donations.findIndex((d) => d.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Donación no encontrada' });
        return;
    }
    store_1.MemoryStore.donations[index] = {
        ...store_1.MemoryStore.donations[index],
        ...req.body,
        id,
    };
    res.json({ message: 'Donación actualizada con éxito', donation: store_1.MemoryStore.donations[index] });
}
function deleteDonation(req, res) {
    const { id } = req.params;
    const index = store_1.MemoryStore.donations.findIndex((d) => d.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Donación no encontrada' });
        return;
    }
    const removed = store_1.MemoryStore.donations.splice(index, 1)[0];
    res.json({ message: 'Donación eliminada', donation: removed });
}
