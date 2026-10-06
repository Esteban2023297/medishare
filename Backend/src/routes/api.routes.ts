import { Router } from 'express';
import { getCurrentUser, login, register } from '../controllers/auth.controller';
import { createDonation, deleteDonation, listDonations, updateDonation } from '../controllers/donations.controller';
import { getDatabaseStatus, getDatabaseTables } from '../controllers/database.controller';
import { getHealthStatus } from '../controllers/health.controller';
import { createMedicine, deleteMedicine, getMedicineById, listMedicines, updateMedicine } from '../controllers/medicines.controller';
import { getMetrics } from '../controllers/metrics.controller';
import { createRequest, deleteRequest, listRequests, updateRequest } from '../controllers/requests.controller';
import { createUser, deleteUser, listUsers, updateUser } from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const apiRouter = Router();

// Health, Database & Metrics
apiRouter.get('/health', getHealthStatus);
apiRouter.get('/metrics', getMetrics);
apiRouter.get('/database/status', getDatabaseStatus);
apiRouter.get('/database/tables', getDatabaseTables);


// Autenticación
apiRouter.post('/auth/login', login);
apiRouter.post('/auth/register', register);
apiRouter.get('/auth/me', authMiddleware, getCurrentUser);

// CRUD Medicamentos (Fármacos en inventario)
apiRouter.get('/medicines', listMedicines);
apiRouter.get('/medicines/:id', getMedicineById);
apiRouter.post('/medicines', authMiddleware, createMedicine);
apiRouter.put('/medicines/:id', authMiddleware, updateMedicine);
apiRouter.delete('/medicines/:id', authMiddleware, deleteMedicine);

// CRUD Donaciones
apiRouter.get('/donations', authMiddleware, listDonations);
apiRouter.post('/donations', authMiddleware, createDonation);
apiRouter.put('/donations/:id', authMiddleware, updateDonation);
apiRouter.delete('/donations/:id', authMiddleware, deleteDonation);

// CRUD Solicitudes Clínicas
apiRouter.get('/requests', authMiddleware, listRequests);
apiRouter.post('/requests', authMiddleware, createRequest);
apiRouter.put('/requests/:id', authMiddleware, updateRequest);
apiRouter.delete('/requests/:id', authMiddleware, deleteRequest);

// CRUD Usuarios y Roles
apiRouter.get('/users', authMiddleware, listUsers);
apiRouter.post('/users', authMiddleware, createUser);
apiRouter.put('/users/:id', authMiddleware, updateUser);
apiRouter.delete('/users/:id', authMiddleware, deleteUser);
