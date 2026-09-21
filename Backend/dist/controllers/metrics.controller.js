"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetrics = getMetrics;
const store_1 = require("../models/store");
function getMetrics(req, res) {
    res.json({
        metrics: store_1.MemoryStore.metrics,
        summary: {
            totalMedicinesInCatalog: store_1.MemoryStore.medicines.length,
            totalDonations: store_1.MemoryStore.donations.length,
            totalRequests: store_1.MemoryStore.requests.length,
            totalUsers: store_1.MemoryStore.users.length,
        },
    });
}
