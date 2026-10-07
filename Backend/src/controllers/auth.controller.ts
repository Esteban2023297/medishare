import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { ENV } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { User, UserRole } from '../models/types';

function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const rawEmail = typeof email === 'string' ? email.trim() : '';
  const rawPassword = typeof password === 'string' ? password.trim() : '';

  if (!rawEmail) {
    res.status(400).json({ error: 'Debes ingresar tu correo electrónico.' });
    return;
  }

  if (!isValidEmail(rawEmail)) {
    res.status(400).json({ error: 'El formato de correo no es válido. Ingresa un correo como usuario@gmail.com o tu@dominio.com.' });
    return;
  }

  if (!rawPassword) {
    res.status(400).json({ error: 'Debes ingresar tu contraseña.' });
    return;
  }

  if (rawPassword.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  const normalized = rawEmail.toLowerCase();

  try {
    const [rows]: [any[], any] = await pool.query(
      `SELECT u.*, r.nombre_rol
       FROM usuarios u
       LEFT JOIN roles r ON u.id_rol = r.id_rol
       WHERE LOWER(u.correo) = ? LIMIT 1`,
      [normalized]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado. Por favor verifica el correo o regístrate en la plataforma.' });
      return;
    }

    const dbUser = rows[0];

    // Validación estricta de contraseña con MySQL
    if (dbUser.contrasena !== rawPassword) {
      res.status(401).json({ error: 'Contraseña incorrecta. Por favor verifica tus credenciales.' });
      return;
    }

    const isAdmin = dbUser.id_rol === 3 || (dbUser.nombre_rol && dbUser.nombre_rol.toLowerCase() === 'administrador');
    const user: User = {
      id: `USR-${String(dbUser.id_usuario).padStart(3, '0')}`,
      name: dbUser.nombre,
      email: dbUser.correo,
      role: isAdmin ? 'admin' : 'usuario',
      institution: dbUser.id_rol === 2 ? dbUser.nombre : (isAdmin ? 'Administración Central' : 'Particular'),
      status: 'Activo',
      createdAt: dbUser.fecha_registro ? new Date(dbUser.fecha_registro).toISOString().split('T')[0] : '2026-01-01',
    };

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: `Bienvenido a MediShare, ${user.name}`,
      token,
      user,
    });
  } catch (error: any) {
    console.error('Error durante login en MySQL:', error);
    res.status(500).json({ error: 'Error al iniciar sesión', details: error?.message });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, role, institution, password, contrasena } = req.body;
  const rawName = typeof name === 'string' ? name.trim() : '';
  const rawEmail = typeof email === 'string' ? email.trim() : '';
  const finalPass = typeof (password || contrasena) === 'string' ? (password || contrasena).trim() : '';

  if (!rawName) {
    res.status(400).json({ error: 'El nombre completo es obligatorio.' });
    return;
  }

  if (rawName.length < 3) {
    res.status(400).json({ error: 'El nombre completo debe tener al menos 3 caracteres.' });
    return;
  }

  if (!rawEmail) {
    res.status(400).json({ error: 'El correo electrónico es obligatorio.' });
    return;
  }

  if (!isValidEmail(rawEmail)) {
    res.status(400).json({ error: 'El formato de correo no es válido. Ingresa un correo como usuario@gmail.com o usuario@you.com.' });
    return;
  }

  if (!finalPass) {
    res.status(400).json({ error: 'Debes definir una contraseña para la cuenta.' });
    return;
  }

  if (finalPass.length < 6) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    return;
  }

  const normalized = rawEmail.toLowerCase();

  try {
    const [existing]: [any[], any] = await pool.query('SELECT id_usuario FROM usuarios WHERE LOWER(correo) = ?', [normalized]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Este correo electrónico ya se encuentra registrado en MediShare.' });
      return;
    }

    const userRole: UserRole = role === 'admin' ? 'admin' : 'usuario';
    const idRol = userRole === 'admin' ? 3 : 1;

    const [insertRes]: any = await pool.query(
      'INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)',
      [name.trim(), normalized, finalPass.trim(), idRol]
    );

    const newUser: User = {
      id: `USR-${String(insertRes.insertId).padStart(3, '0')}`,
      name: name.trim(),
      email: normalized,
      role: userRole,
      institution: institution || (userRole === 'admin' ? 'Administración Central' : 'Usuario Particular'),
      status: 'Activo',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'Cuenta creada exitosamente en MediShare',
      token,
      user: newUser,
    });
  } catch (error: any) {
    console.error('Error durante registro en MySQL:', error);
    res.status(500).json({ error: 'Error al registrar usuario', details: error?.message });
  }
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }
  res.json({ user: req.user });
}
