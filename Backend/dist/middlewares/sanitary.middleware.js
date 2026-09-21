"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSanitaryExpiration = validateSanitaryExpiration;
/**
 * Middleware Sanitario de MediShare:
 * Bloquea en el servidor cualquier registro de medicamento con fecha de caducidad
 * inferior a 90 días (3 meses) respecto a la fecha actual.
 */
function validateSanitaryExpiration(req, res, next) {
    const { expirationDate } = req.body;
    if (!expirationDate) {
        res.status(400).json({ error: 'La fecha de caducidad es un campo obligatorio.' });
        return;
    }
    const expDate = new Date(expirationDate);
    if (isNaN(expDate.getTime())) {
        res.status(400).json({ error: 'Formato de fecha de caducidad inválido. Utiliza formato YYYY-MM-DD.' });
        return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
        res.status(422).json({
            error: 'Infracción sanitaria: El fármaco ya ha caducado. No puede ser aceptado bajo ninguna circunstancia.',
            code: 'ALREADY_EXPIRED',
            daysRemaining: diffDays,
        });
        return;
    }
    const MIN_DAYS_REQUIRED = 90;
    if (diffDays < MIN_DAYS_REQUIRED) {
        res.status(422).json({
            error: `Infracción sanitaria: El fármaco solo cuenta con ${diffDays} días de vigencia. La normativa exige un margen mínimo de ${MIN_DAYS_REQUIRED} días (3 meses) para garantizar su distribución comunitaria segura.`,
            code: 'SANITARY_THRESHOLD_VIOLATION',
            daysRemaining: diffDays,
            requiredDays: MIN_DAYS_REQUIRED,
        });
        return;
    }
    next();
}
