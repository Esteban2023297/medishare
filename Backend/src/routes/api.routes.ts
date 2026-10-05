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

apiRouter.get('/health', getHealthStatus);

apiRouter.get('/metrics', getMetrics);

apiRouter.post('/auth/login', login);
apiRouter.post('/auth/register', register);
apiRouter.get('/auth/me', authMiddleware, getCurrentUser);

apiRouter.get('/medicines', listMedicines);
apiRouter.get('/medicines/:id', getMedicineById);
apiRouter.post('/medicines', authMiddleware, requireRole('admin'), createMedicine);
apiRouter.put('/medicines/:id', authMiddleware, requireRole('admin'), updateMedicine);
apiRouter.delete('/medicines/:id', authMiddleware, requireRole('admin'), deleteMedicine);

    apiRouter.get('/donations', authMiddleware, listDonations);
apiRouter.post('/donations', authMiddleware, validateSanitaryExpiration, createDonation);
apiRouter.put('/donations/:id', authMiddleware, requireRole('admin'), updateDonation);
apiRouter.delete('/donations/:id', authMiddleware, requireRole('admin'), deleteDonation);

apiRouter.get('/requests', authMiddleware, listRequests);
apiRouter.post('/requests', authMiddleware, createRequest);
apiRouter.put('/requests/:id', authMiddleware, requireRole('admin'), updateRequest);
apiRouter.delete('/requests/:id', authMiddleware, requireRole('admin'), deleteRequest);

apiRouter.get('/users', authMiddleware, requireRole('admin'), listUsers);
apiRouter.post('/users', authMiddleware, requireRole('admin'), createUser);
apiRouter.put('/users/:id', authMiddleware, requireRole('admin'), updateUser);
apiRouter.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser);
