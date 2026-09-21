"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const store_1 = require("../models/store");
function listUsers(req, res) {
    res.json({ count: store_1.MemoryStore.users.length, users: store_1.MemoryStore.users });
}
function createUser(req, res) {
    const { name, email, role, institution } = req.body;
    if (!name || !email) {
        res.status(400).json({ error: 'Nombre y correo electrónico son requeridos' });
        return;
    }
    const normalized = email.trim().toLowerCase();
    const exists = store_1.MemoryStore.users.some((u) => u.email.toLowerCase() === normalized);
    if (exists) {
        res.status(409).json({ error: 'El correo electrónico ya existe' });
        return;
    }
    const nextId = `USR-${(store_1.MemoryStore.users.length + 1).toString().padStart(3, '0')}`;
    const newUser = {
        id: nextId,
        name: name.trim(),
        email: normalized,
        role: (role === 'admin' ? 'admin' : 'usuario'),
        institution: institution || 'Particular',
        status: 'Activo',
        createdAt: new Date().toISOString().split('T')[0],
    };
    store_1.MemoryStore.users.push(newUser);
    res.status(201).json({ message: 'Usuario creado', user: newUser });
}
function updateUser(req, res) {
    const { id } = req.params;
    const index = store_1.MemoryStore.users.findIndex((u) => u.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
    }
    store_1.MemoryStore.users[index] = {
        ...store_1.MemoryStore.users[index],
        ...req.body,
        id,
    };
    res.json({ message: 'Usuario actualizado', user: store_1.MemoryStore.users[index] });
}
function deleteUser(req, res) {
    const { id } = req.params;
    const index = store_1.MemoryStore.users.findIndex((u) => u.id === id);
    if (index === -1) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
    }
    const removed = store_1.MemoryStore.users.splice(index, 1)[0];
    res.json({ message: 'Usuario eliminado', user: removed });
}
