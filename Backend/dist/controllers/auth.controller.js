"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.register = register;
exports.getCurrentUser = getCurrentUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const store_1 = require("../models/store");
function isValidEmail(email) {
    if (!email)
        return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}
function login(req, res) {
    const { email, password } = req.body;
    if (!email || !isValidEmail(email)) {
        res.status(400).json({ error: 'Debes ingresar un correo electrónico con formato válido (ej. usuario@gmail.com, tu@you.com).' });
        return;
    }
    const normalized = email.trim().toLowerCase();
    let user = store_1.MemoryStore.users.find((u) => u.email.toLowerCase() === normalized);
    if (!user) {
        // Si es un correo válido no registrado, creamos la cuenta sobre la marcha
        const role = normalized.includes('admin') ? 'admin' : 'usuario';
        const namePart = normalized.split('@')[0].replace('.', ' ');
        user = {
            id: `USR-${(store_1.MemoryStore.users.length + 1).toString().padStart(3, '0')}`,
            name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
            email: normalized,
            role,
            status: 'Activo',
            createdAt: new Date().toISOString().split('T')[0],
        };
        store_1.MemoryStore.users.push(user);
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, env_1.ENV.JWT_SECRET, {
        expiresIn: '7d',
    });
    res.json({
        message: `Bienvenido a MediShare, ${user.name}`,
        token,
        user,
    });
}
function register(req, res) {
    const { name, email, role, institution } = req.body;
    if (!name || name.trim().length < 3) {
        res.status(400).json({ error: 'El nombre completo es obligatorio (mínimo 3 caracteres).' });
        return;
    }
    if (!email || !isValidEmail(email)) {
        res.status(400).json({ error: 'El formato de correo no es válido. Admite cualquier extensión de dominio.' });
        return;
    }
    const normalized = email.trim().toLowerCase();
    const exists = store_1.MemoryStore.users.some((u) => u.email.toLowerCase() === normalized);
    if (exists) {
        res.status(409).json({ error: 'Este correo electrónico ya se encuentra registrado en MediShare.' });
        return;
    }
    const userRole = role === 'admin' ? 'admin' : 'usuario';
    const newUser = {
        id: `USR-${(store_1.MemoryStore.users.length + 1).toString().padStart(3, '0')}`,
        name: name.trim(),
        email: normalized,
        role: userRole,
        institution: institution || (userRole === 'admin' ? 'Administración Central' : 'Usuario Particular'),
        status: 'Activo',
        createdAt: new Date().toISOString().split('T')[0],
    };
    store_1.MemoryStore.users.unshift(newUser);
    const token = jsonwebtoken_1.default.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, env_1.ENV.JWT_SECRET, {
        expiresIn: '7d',
    });
    res.status(201).json({
        message: 'Cuenta creada exitosamente en MediShare',
        token,
        user: newUser,
    });
}
function getCurrentUser(req, res) {
    if (!req.user) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }
    res.json({ user: req.user });
}
