"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRequests = listRequests;
exports.createRequest = createRequest;
exports.updateRequest = updateRequest;
exports.deleteRequest = deleteRequest;
const store_1 = require("../models/store");
function listRequests(req, res) {
    res.json({ count: store_1.MemoryStore.requests.length, requests: store_1.MemoryStore.requests });
}
function createRequest(req, res) {
    const { catalogItemId, clinicName, requestedUnits, urgency } = req.body;
    if (!catalogItemId || !clinicName || !requestedUnits) {
        res.status(400).json({ error: 'Campos incompletos para solicitar medicamentos' });
        return;
    }
    const item = store_1.MemoryStore.medicines.find((m) => m.id === catalogItemId);
    if (!item) {
        res.status(404).json({ error: 'Medicamento no encontrado en el inventario' });
        return;
    }
    const units = Number(requestedUnits);
    if (item.availableUnits < units) {
        res.status(422).json({
            error: `Stock insuficiente en dispensario. Solo se dispone de ${item.availableUnits} unidades.`,
        });
        return;
    }
    // Descontar inventario disponible
    item.availableUnits -= units;
    store_1.MemoryStore.metrics.unitsDistributed += units;
    const nextId = `SOL-${(store_1.MemoryStore.requests.length + 101).toString()}`;
    const newRequest = {
        id: nextId,
        clinicName,
        activeIngredient: item.activeIngredient,
        presentation: item.presentation,
        requestedUnits: units,
        requestDate: new Date().toISOString().split('T')[0],
        urgency: urgency || 'Media',
        status: 'Aprobada',
    };
    store_1.MemoryStore.requests.unshift(newRequest);
    res.status(201).json({
        message: `Solicitud de ${units} unidades de ${item.activeIngredient} aprobada para ${clinicName}.`,
        request: newRequest,
    });
}
function updateRequest(req, res) {
    const { id } = req.params;
    const index = store_1.MemoryStore.requests.findIndex((r) => r.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Solicitud clínica no encontrada' });
        return;
    }
    store_1.MemoryStore.requests[index] = {
        ...store_1.MemoryStore.requests[index],
        ...req.body,
        id,
    };
    res.json({ message: 'Solicitud clínica actualizada', request: store_1.MemoryStore.requests[index] });
}
function deleteRequest(req, res) {
    const { id } = req.params;
    const index = store_1.MemoryStore.requests.findIndex((r) => r.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Solicitud clínica no encontrada' });
        return;
    }
    const removed = store_1.MemoryStore.requests.splice(index, 1)[0];
    res.json({ message: 'Solicitud clínica eliminada', request: removed });
}
