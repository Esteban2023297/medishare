import { NextFunction, Response } from 'express';
import { UserRole } from '../models/types';
import { AuthenticatedRequest } from './auth.middleware';

export function requireRole(expectedRole: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Acceso no autorizado. Se requiere iniciar sesión.' });
      return;
    }

    if (req.user.role !== expectedRole) {
      res.status(403).json({
        error: `Acceso restringido. Se requiere rol de ${expectedRole} para realizar esta operación. Tu rol actual es: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
