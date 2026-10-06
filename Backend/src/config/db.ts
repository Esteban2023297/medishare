import mysql from 'mysql2/promise';
import { ENV } from './env';

export const pool = mysql.createPool({
  host: ENV.DB_HOST,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,
  port: ENV.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export interface DbConnectionStatus {
  connected: boolean;
  latencyMs: number;
  error?: string;
}

export const checkDatabaseConnection = async (): Promise<DbConnectionStatus> => {
  const start = Date.now();
  try {
    const connection = await pool.getConnection();
    const latencyMs = Date.now() - start;
    console.log(` ¡Conectado exitosamente a la base de datos MySQL (${ENV.DB_NAME}) en ${latencyMs}ms!`);
    connection.release();
    return { connected: true, latencyMs };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    console.error(' Error al conectar a MySQL:', error?.message || error);
    return {
      connected: false,
      latencyMs,
      error: error?.message || 'No se pudo establecer conexión con MySQL',
    };
  }
};