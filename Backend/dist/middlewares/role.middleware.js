"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(expectedRole) {
    return (req, res, next) => {
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
