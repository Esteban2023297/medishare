import { Router } from 'express';
import { getCurrentUser, login, register } from '../controllers/auth.controller';
import { createDonation, deleteDonation, listDonations, updateDonation } from '../controllers/donations.controller';
import { getHealthStatus } from '../controllers/health.controller';
import { createMedicine, deleteMedicine, getMedicineById, listMedicines, updateMedicine } from '../controllers/medicines.controller';
import { getMetrics } from '../controllers/metrics.controller';
import { createRequest, deleteRequest, listRequests, updateRequest } from '../controllers/requests.controller';
import { createUser, deleteUser, listUsers, updateUser } from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateSanitaryExpiration } from '../middlewares/sanitary.middleware';

export const apiRouter = Router();

// 1. Diagnóstico y Salud
apiRouter.get('/health', getHealthStatus);

// 2. Métricas de Impacto
apiRouter.get('/metrics', getMetrics);

// 3. Autenticación y Cuentas
apiRouter.post('/auth/login', login);
apiRouter.post('/auth/register', register);
apiRouter.get('/auth/me', authMiddleware, getCurrentUser);

// 4. Catálogo de Medicamentos (Público / Clínicas / Admin CRUD)
apiRouter.get('/medicines', listMedicines);
apiRouter.get('/medicines/:id', getMedicineById);
apiRouter.post('/medicines', authMiddleware, requireRole('admin'), createMedicine);
apiRouter.put('/medicines/:id', authMiddleware, requireRole('admin'), updateMedicine);
apiRouter.delete('/medicines/:id', authMiddleware, requireRole('admin'), deleteMedicine);

// 5. Donaciones (Con validación sanitaria estricta de 90 días en el servidor)
apiRouter.get('/donations', authMiddleware, listDonations);
apiRouter.post('/donations', authMiddleware, validateSanitaryExpiration, createDonation);
apiRouter.put('/donations/:id', authMiddleware, requireRole('admin'), updateDonation);
apiRouter.delete('/donations/:id', authMiddleware, requireRole('admin'), deleteDonation);

// 6. Solicitudes de Clínicas
apiRouter.get('/requests', authMiddleware, listRequests);
apiRouter.post('/requests', authMiddleware, createRequest);
apiRouter.put('/requests/:id', authMiddleware, requireRole('admin'), updateRequest);
apiRouter.delete('/requests/:id', authMiddleware, requireRole('admin'), deleteRequest);

// 7. Gestión de Usuarios y Roles (Exclusivo Administrador)
apiRouter.get('/users', authMiddleware, requireRole('admin'), listUsers);
apiRouter.post('/users', authMiddleware, requireRole('admin'), createUser);
apiRouter.put('/users/:id', authMiddleware, requireRole('admin'), updateUser);
apiRouter.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser);
