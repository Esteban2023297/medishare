"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const donations_controller_1 = require("../controllers/donations.controller");
const database_controller_1 = require("../controllers/database.controller");
const health_controller_1 = require("../controllers/health.controller");
const medicines_controller_1 = require("../controllers/medicines.controller");
const metrics_controller_1 = require("../controllers/metrics.controller");
const requests_controller_1 = require("../controllers/requests.controller");
const users_controller_1 = require("../controllers/users.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.apiRouter = (0, express_1.Router)();
// Health, Database & Metrics
exports.apiRouter.get('/health', health_controller_1.getHealthStatus);
exports.apiRouter.get('/metrics', metrics_controller_1.getMetrics);
exports.apiRouter.get('/database/status', database_controller_1.getDatabaseStatus);
exports.apiRouter.get('/database/tables', database_controller_1.getDatabaseTables);
exports.apiRouter.get('/database/views', database_controller_1.getDatabaseViews);
// Autenticación
exports.apiRouter.post('/auth/login', auth_controller_1.login);
exports.apiRouter.post('/auth/register', auth_controller_1.register);
exports.apiRouter.get('/auth/me', auth_middleware_1.authMiddleware, auth_controller_1.getCurrentUser);
// CRUD Medicamentos (Fármacos en inventario)
exports.apiRouter.get('/medicines', medicines_controller_1.listMedicines);
exports.apiRouter.get('/medicines/:id', medicines_controller_1.getMedicineById);
exports.apiRouter.post('/medicines', auth_middleware_1.authMiddleware, medicines_controller_1.createMedicine);
exports.apiRouter.put('/medicines/:id', auth_middleware_1.authMiddleware, medicines_controller_1.updateMedicine);
exports.apiRouter.delete('/medicines/:id', auth_middleware_1.authMiddleware, medicines_controller_1.deleteMedicine);
// CRUD Donaciones
exports.apiRouter.get('/donations', auth_middleware_1.authMiddleware, donations_controller_1.listDonations);
exports.apiRouter.post('/donations', auth_middleware_1.authMiddleware, donations_controller_1.createDonation);
exports.apiRouter.put('/donations/:id', auth_middleware_1.authMiddleware, donations_controller_1.updateDonation);
exports.apiRouter.delete('/donations/:id', auth_middleware_1.authMiddleware, donations_controller_1.deleteDonation);
// CRUD Solicitudes Clínicas
exports.apiRouter.get('/requests', auth_middleware_1.authMiddleware, requests_controller_1.listRequests);
exports.apiRouter.post('/requests', auth_middleware_1.authMiddleware, requests_controller_1.createRequest);
exports.apiRouter.put('/requests/:id', auth_middleware_1.authMiddleware, requests_controller_1.updateRequest);
exports.apiRouter.delete('/requests/:id', auth_middleware_1.authMiddleware, requests_controller_1.deleteRequest);
// CRUD Usuarios y Roles
exports.apiRouter.get('/users', auth_middleware_1.authMiddleware, users_controller_1.listUsers);
exports.apiRouter.post('/users', auth_middleware_1.authMiddleware, users_controller_1.createUser);
exports.apiRouter.put('/users/:id', auth_middleware_1.authMiddleware, users_controller_1.updateUser);
exports.apiRouter.delete('/users/:id', auth_middleware_1.authMiddleware, users_controller_1.deleteUser);
