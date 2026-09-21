"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const donations_controller_1 = require("../controllers/donations.controller");
const health_controller_1 = require("../controllers/health.controller");
const medicines_controller_1 = require("../controllers/medicines.controller");
const metrics_controller_1 = require("../controllers/metrics.controller");
const requests_controller_1 = require("../controllers/requests.controller");
const users_controller_1 = require("../controllers/users.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const sanitary_middleware_1 = require("../middlewares/sanitary.middleware");
exports.apiRouter = (0, express_1.Router)();
// 1. Diagnóstico y Salud
exports.apiRouter.get('/health', health_controller_1.getHealthStatus);
// 2. Métricas de Impacto
exports.apiRouter.get('/metrics', metrics_controller_1.getMetrics);
// 3. Autenticación y Cuentas
exports.apiRouter.post('/auth/login', auth_controller_1.login);
exports.apiRouter.post('/auth/register', auth_controller_1.register);
exports.apiRouter.get('/auth/me', auth_middleware_1.authMiddleware, auth_controller_1.getCurrentUser);
// 4. Catálogo de Medicamentos (Público / Clínicas / Admin CRUD)
exports.apiRouter.get('/medicines', medicines_controller_1.listMedicines);
exports.apiRouter.get('/medicines/:id', medicines_controller_1.getMedicineById);
exports.apiRouter.post('/medicines', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), medicines_controller_1.createMedicine);
exports.apiRouter.put('/medicines/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), medicines_controller_1.updateMedicine);
exports.apiRouter.delete('/medicines/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), medicines_controller_1.deleteMedicine);
// 5. Donaciones (Con validación sanitaria estricta de 90 días en el servidor)
exports.apiRouter.get('/donations', auth_middleware_1.authMiddleware, donations_controller_1.listDonations);
exports.apiRouter.post('/donations', auth_middleware_1.authMiddleware, sanitary_middleware_1.validateSanitaryExpiration, donations_controller_1.createDonation);
exports.apiRouter.put('/donations/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), donations_controller_1.updateDonation);
exports.apiRouter.delete('/donations/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), donations_controller_1.deleteDonation);
// 6. Solicitudes de Clínicas
exports.apiRouter.get('/requests', auth_middleware_1.authMiddleware, requests_controller_1.listRequests);
exports.apiRouter.post('/requests', auth_middleware_1.authMiddleware, requests_controller_1.createRequest);
exports.apiRouter.put('/requests/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), requests_controller_1.updateRequest);
exports.apiRouter.delete('/requests/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), requests_controller_1.deleteRequest);
// 7. Gestión de Usuarios y Roles (Exclusivo Administrador)
exports.apiRouter.get('/users', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), users_controller_1.listUsers);
exports.apiRouter.post('/users', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), users_controller_1.createUser);
exports.apiRouter.put('/users/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), users_controller_1.updateUser);
exports.apiRouter.delete('/users/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'), users_controller_1.deleteUser);
