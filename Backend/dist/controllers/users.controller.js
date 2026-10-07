"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const db_1 = require("../config/db");
// Helper para extraer ID numérico (admite 'USR-001', '1', etc.)
function parseUserId(idStr) {
    const digits = idStr.replace(/\D/g, '');
    const parsed = parseInt(digits || idStr, 10);
    return isNaN(parsed) ? null : parsed;
}
function capitalizeWords(str) {
    if (!str)
        return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}
async function listUsers(req, res) {
    try {
        const [rows] = await db_1.pool.query(`SELECT u.id_usuario, u.nombre, u.correo, u.contrasena, u.id_rol, r.nombre_rol, u.fecha_registro
       FROM usuarios u
       LEFT JOIN roles r ON u.id_rol = r.id_rol
       ORDER BY u.id_usuario ASC`);
        const users = rows.map((u) => {
            const isAdmin = u.id_rol === 3 || (u.nombre_rol && u.nombre_rol.toLowerCase() === 'administrador');
            const isClinica = u.id_rol === 2 || (u.nombre_rol && u.nombre_rol.toLowerCase() === 'clinica');
            return {
                id: `USR-${String(u.id_usuario).padStart(3, '0')}`,
                name: capitalizeWords(u.nombre),
                email: u.correo,
                role: isAdmin ? 'admin' : 'usuario',
                institution: isClinica ? capitalizeWords(u.nombre) : (isAdmin ? 'Administración Central' : 'Particular'),
                status: 'Activo',
                createdAt: u.fecha_registro ? new Date(u.fecha_registro).toISOString().split('T')[0] : '2026-01-01',
            };
        });
        res.json({ count: users.length, users });
    }
    catch (error) {
        console.error('Error al listar usuarios desde MySQL:', error);
        res.status(500).json({ error: 'Error al consultar la base de datos SQL', details: error?.message });
    }
}
async function createUser(req, res) {
    const { name, email, role, institution, password, contrasena } = req.body;
    if (!name || !email) {
        res.status(400).json({ error: 'Nombre y correo electrónico son requeridos' });
        return;
    }
    const finalPassword = password || contrasena;
    if (!finalPassword) {
        res.status(400).json({ error: 'La contraseña es requerida para crear el usuario' });
        return;
    }
    const normalized = email.trim().toLowerCase();
    try {
        // Comprobar existencia previa de correo
        const [existing] = await db_1.pool.query('SELECT id_usuario FROM usuarios WHERE LOWER(correo) = ?', [normalized]);
        if (existing.length > 0) {
            res.status(409).json({ error: 'El correo electrónico ya existe en la base de datos' });
            return;
        }
        // Determinar id_rol: 3 = administrador, 2 = clinica, 1 = donante/usuario
        let idRol = 1;
        if (role === 'admin') {
            idRol = 3;
        }
        else if (institution && institution.toLowerCase().includes('clínica') || institution && institution.toLowerCase().includes('clinica')) {
            idRol = 2;
        }
        const [result] = await db_1.pool.query('INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)', [name.trim(), normalized, finalPassword, idRol]);
        const insertedId = result.insertId;
        const newUser = {
            id: `USR-${String(insertedId).padStart(3, '0')}`,
            name: name.trim(),
            email: normalized,
            role: (role === 'admin' ? 'admin' : 'usuario'),
            institution: institution || 'Particular',
            status: 'Activo',
            createdAt: new Date().toISOString().split('T')[0],
        };
        res.status(201).json({ message: 'Usuario creado exitosamente en MySQL', user: newUser });
    }
    catch (error) {
        console.error('Error al insertar usuario en MySQL:', error);
        res.status(500).json({ error: 'Error al guardar el usuario en la base de datos', details: error?.message });
    }
}
async function updateUser(req, res) {
    const { id } = req.params;
    const numId = parseUserId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
    }
    const { name, email, role, institution, password, contrasena } = req.body;
    try {
        const [existing] = await db_1.pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [numId]);
        if (existing.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        const current = existing[0];
        const newName = name !== undefined ? name.trim() : current.nombre;
        const newEmail = email !== undefined ? email.trim().toLowerCase() : current.correo;
        const newPassword = password || contrasena || current.contrasena;
        let newIdRol = current.id_rol;
        if (role !== undefined) {
            newIdRol = role === 'admin' ? 3 : 1;
        }
        await db_1.pool.query('UPDATE usuarios SET nombre = ?, correo = ?, contrasena = ?, id_rol = ? WHERE id_usuario = ?', [newName, newEmail, newPassword, newIdRol, numId]);
        const updatedUser = {
            id: `USR-${String(numId).padStart(3, '0')}`,
            name: newName,
            email: newEmail,
            role: newIdRol === 3 ? 'admin' : 'usuario',
            institution: institution || 'Particular',
            status: 'Activo',
            createdAt: current.fecha_registro ? new Date(current.fecha_registro).toISOString().split('T')[0] : '2026-01-01',
        };
        res.json({ message: 'Usuario actualizado con éxito en MySQL', user: updatedUser });
    }
    catch (error) {
        console.error('Error al actualizar usuario en MySQL:', error);
        res.status(500).json({ error: 'Error al actualizar usuario en la base de datos', details: error?.message });
    }
}
async function deleteUser(req, res) {
    const { id } = req.params;
    const numId = parseUserId(id);
    if (numId === null) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
    }
    try {
        const [existing] = await db_1.pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [numId]);
        if (existing.length === 0) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        // Comprobar y manejar dependencias de claves foráneas antes de borrar
        await db_1.pool.query('DELETE FROM solicitudes_clinicas WHERE id_clinica = ?', [numId]);
        await db_1.pool.query('DELETE FROM donaciones WHERE id_usuario = ?', [numId]);
        await db_1.pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [numId]);
        res.json({ message: 'Usuario eliminado exitosamente de MySQL', id });
    }
    catch (error) {
        console.error('Error al eliminar usuario en MySQL:', error);
        res.status(500).json({ error: 'Error al eliminar usuario en la base de datos', details: error?.message });
    }
}
