import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { checkDatabaseConnection } from './config/db';
import { ENV } from './config/env';
import { apiRouter } from './routes/api.routes';

const app = express();

// Middlewares globales
app.use(
  cors({
    origin: '*', // Permitir solicitudes desde el frontend Angular (localhost:4200)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-email'],
  })
);

app.use(express.json());

// Logger de solicitudes en desarrollo
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Enrutador de API REST
app.use('/api', apiRouter);

// Manejador de ruta raíz
app.get('/', (req: Request, res: Response) => {
  res.json({
    project: 'MediShare Backend API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Manejador global de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error no controlado en API]:', err);
  res.status(500).json({
    error: 'Error interno del servidor en MediShare API',
    details: err?.message || 'Error desconocido',
  });
});

// Inicialización del servidor
app.listen(ENV.PORT, async () => {
  console.log('====================================================');
  console.log(`🚀 MediShare Backend API ejecutándose en puerto ${ENV.PORT}`);
  console.log(`🔗 URL Base: http://localhost:${ENV.PORT}/api`);
  console.log(`🌐 CORS habilitado para: ${ENV.CORS_ORIGIN}`);
  console.log('====================================================');

  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.connected) {
    console.log(`✅ Conexión con PostgreSQL exitosa (${dbStatus.latencyMs}ms).`);
  } else {
    console.log(`ℹ️ [Aviso Base de Datos]: ${dbStatus.error}`);
    console.log('📦 Almacén en memoria sincronizado con schema.sql operativo.');
  }
});

export default app;
