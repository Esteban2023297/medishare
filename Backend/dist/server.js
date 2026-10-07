"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const api_routes_1 = require("./routes/api.routes");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: '*', // Permitir solicitudes desde el frontend Angular (localhost:4200)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email'],
}));
app.use(express_1.default.json());
// Logger de solicitudes en desarrollo
app.use((req, res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
});
// Enrutador de API REST
app.use('/api', api_routes_1.apiRouter);
// Manejador de ruta raíz
app.get('/', (req, res) => {
    res.json({
        project: 'MediShare Backend API',
        status: 'online',
        version: '1.0.0',
        documentation: '/api/health',
    });
});
// Manejador global de errores
app.use((err, req, res, next) => {
    console.error('[Error no controlado en API]:', err);
    res.status(500).json({
        error: 'Error interno del servidor en MediShare API',
        details: err?.message || 'Error desconocido',
    });
});
// Inicialización del servidor
app.listen(env_1.ENV.PORT, async () => {
    console.log('====================================================');
    console.log(` MediShare Backend API ejecutándose en puerto ${env_1.ENV.PORT}`);
    console.log(` URL Base: http://localhost:${env_1.ENV.PORT}/api`);
    console.log(` CORS habilitado para: ${env_1.ENV.CORS_ORIGIN}`);
    console.log('====================================================');
    const dbStatus = await (0, db_1.checkDatabaseConnection)();
    if (dbStatus.connected) {
        console.log(` Conexión con MySQL exitosa (${dbStatus.latencyMs}ms).`);
    }
    else {
        console.log(` [Aviso Base de Datos]: ${dbStatus.error}`);
    }
    console.log(` Para abrir el Panel de Terminal interactivo, ejecuta: pnpm panel`);
});
exports.default = app;
