import { Request, Response } from 'express';
import { MemoryStore } from '../models/store';
import { User, UserRole } from '../models/types';

export function listUsers(req: Request, res: Response): void {
  res.json({ count: MemoryStore.users.length, users: MemoryStore.users });
}

export function createUser(req: Request, res: Response): void {
  const { name, email, role, institution } = req.body;

  if (!name || !email) {
    res.status(400).json({ error: 'Nombre y correo electrónico son requeridos' });
    return;
  }

  const normalized = email.trim().toLowerCase();
  const exists = MemoryStore.users.some((u) => u.email.toLowerCase() === normalized);
  if (exists) {
    res.status(409).json({ error: 'El correo electrónico ya existe' });
    return;
  }

  const nextId = `USR-${(MemoryStore.users.length + 1).toString().padStart(3, '0')}`;
  const newUser: User = {
    id: nextId,
    name: name.trim(),
    email: normalized,
    role: (role === 'admin' ? 'admin' : 'usuario') as UserRole,
    institution: institution || 'Particular',
    status: 'Activo',
    createdAt: new Date().toISOString().split('T')[0],
  };

  MemoryStore.users.push(newUser);
  res.status(201).json({ message: 'Usuario creado', user: newUser });
}

export function updateUser(req: Request, res: Response): void {
  const { id } = req.params;
  const index = MemoryStore.users.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  MemoryStore.users[index] = {
    ...MemoryStore.users[index],
    ...req.body,
    id,
  };

  res.json({ message: 'Usuario actualizado', user: MemoryStore.users[index] });
}

export function deleteUser(req: Request, res: Response): void {
  const { id } = req.params;
  const index = MemoryStore.users.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const removed = MemoryStore.users.splice(index, 1)[0];
  res.json({ message: 'Usuario eliminado', user: removed });
}
