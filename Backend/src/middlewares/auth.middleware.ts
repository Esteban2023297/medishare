import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { MemoryStore } from '../models/store';
import { User } from '../models/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Si no hay encabezado pero se envía x-user-email (para pruebas rápidas de frontend), lo resolvemos
    const testEmail = req.headers['x-user-email'] as string;
    if (testEmail) {
      const user = MemoryStore.users.find((u) => u.email.toLowerCase() === testEmail.toLowerCase());
      if (user) {
        req.user = user;
        return next();
      }
    }
    // Usuario anónimo permitido si la ruta no exige rol estricto
    return next();
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string };
    const user = MemoryStore.users.find((u) => u.id === decoded.id || u.email === decoded.email);
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token de autenticación inválido o expirado' });
  }
}
