import mysql, { Pool } from 'mysql2/promise';
import { ENV } from './env';

export let pool: Pool = mysql.createPool({
  host: ENV.DB_HOST,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_NAME,
  port: ENV.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export interface DbConnectionStatus {
  connected: boolean;
  latencyMs: number;
  database?: string;
  error?: string;
}

export const checkDatabaseConnection = async (): Promise<DbConnectionStatus> => {
  const start = Date.now();
  try {
    const connection = await pool.getConnection();
    const latencyMs = Date.now() - start;
    console.log(` ¡Conectado exitosamente a la base de datos MySQL (${ENV.DB_NAME}) en ${latencyMs}ms!`);
    connection.release();
    return { connected: true, latencyMs, database: ENV.DB_NAME };
  } catch (error: any) {
    console.warn(` Primer intento con (${ENV.DB_USER}, db: ${ENV.DB_NAME}) falló: ${error?.message}. Probando fallback...`);
    const fallbackConfigs = [
      { user: 'IN5BM', password: '', database: 'medishare_In5bm' },
      { user: 'IN5BM', password: '', database: 'medishare_db' },
      { user: 'root', password: '', database: 'medishare_In5bm' },
      { user: 'root', password: '', database: 'medishare_db' },
    ];

    for (const cfg of fallbackConfigs) {
      try {
        const testPool = mysql.createPool({
          host: ENV.DB_HOST,
          user: cfg.user,
          password: cfg.password,
          database: cfg.database,
          port: ENV.DB_PORT,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
        const conn = await testPool.getConnection();
        conn.release();
        pool = testPool;
        ENV.DB_USER = cfg.user;
        ENV.DB_PASSWORD = cfg.password;
        ENV.DB_NAME = cfg.database;
        const latencyMs = Date.now() - start;
        console.log(` ¡Conexión alternativa exitosa con ${cfg.user}@${cfg.database} en ${latencyMs}ms!`);
        return { connected: true, latencyMs, database: cfg.database };
      } catch (_) {}
    }

    const latencyMs = Date.now() - start;
    console.error(' Error crítico al conectar a MySQL:', error?.message || error);
    return {
      connected: false,
      latencyMs,
      error: error?.message || 'No se pudo establecer conexión con MySQL',
    };
  }
};