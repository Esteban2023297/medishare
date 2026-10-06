import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { pool } from '../config/db';
import { ENV } from '../config/env';

interface LoggedUser {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
}

let activeUser: LoggedUser | null = null;

export async function startTerminalPanel(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  try {
    console.log('\n=============================================================');
    console.log('  PANEL DE TERMINAL INTERACTIVO - MEDISHARE (VS CODE)');
    console.log('=============================================================');
    console.log('Este panel te permite iniciar sesión y gestionar el CRUD');
    console.log('directamente desde esta consola de Visual Studio Code.\n');

    while (true) {
      if (!activeUser) {
        console.log('-------------------------------------------------------------');
        console.log(' INICIO DE SESIÓN REQUERIDO:');
        console.log('-------------------------------------------------------------');
        console.log('[1] Iniciar Sesión (Validar contra MySQL)');
        console.log('[2] Registrar Nuevo Usuario en MySQL');
        console.log('[3] Salir del Panel');
        console.log('[4] Cuentas demo predeterminadas');
        const opt = (await rl.question('\nSelecciona una opción (1-4): ')).trim();

        if (opt === '1') {
          await handleCliLogin(rl);
        } else if (opt === '2') {
          await handleCliRegister(rl);
        } else if (opt === '3') {
          console.log('\n Saliendo del panel. ¡Hasta luego!\n');
          break;
        } else if (opt === '4') {
          console.log('\n Cuentas registradas en MySQL medishare_In5bm:');
          console.log('  • Admin:   admin@medishare.com | Contraseña: 123456');
          console.log('  • Usuario: carlos@email.com    | Contraseña: 123456');
          console.log('  • Clínica: contacto@esperanza.com | Contraseña: 123456\n');
        } else {
          console.log(' Opción inválida.');
        }
      } else {
        // Menú principal una vez autenticado
        console.log('\n=============================================================');
        console.log(` SESIÓN ACTIVA: ${activeUser.nombre} (${activeUser.correo}) | Rol: ${activeUser.rol}`);
        console.log('=============================================================');
        console.log('[1]  Medicamentos (Ver catálogo, Crear, Editar, Eliminar)');
        console.log('[2]  Donaciones (Ver lista, Crear, Editar, Eliminar)');
        console.log('[3]  Solicitudes Clínicas (Ver pedidos, Crear, Editar, Eliminar)');
        console.log('[4]  Usuarios & Roles (Ver lista, Crear c/contraseña, Editar, Eliminar)');
        console.log('[5]  Probar Conexión y Ver Estadísticas MySQL');
        console.log('[6]  Cerrar Sesión');
        console.log('[0]  Salir del Panel (Mantener API activa)');

        const mainOpt = (await rl.question('\nSelecciona una sección [0-6]: ')).trim();

        if (mainOpt === '1') {
          await menuMedicamentos(rl);
        } else if (mainOpt === '2') {
          await menuDonaciones(rl);
        } else if (mainOpt === '3') {
          await menuSolicitudes(rl);
        } else if (mainOpt === '4') {
          await menuUsuarios(rl);
        } else if (mainOpt === '5') {
          await menuEstadoDb();
        } else if (mainOpt === '6') {
          activeUser = null;
          console.log('\n Sesión cerrada con éxito.\n');
        } else if (mainOpt === '0') {
          console.log('\n Saliendo del panel. ¡Hasta luego!\n');
          break;
        } else {
          console.log(' Opción no válida.');
        }
      }
    }
  } catch (err: any) {
    if (err?.code !== 'ERR_USE_AFTER_CLOSE') {
      console.error('Error en el panel de terminal:', err?.message || err);
    }
  } finally {
    rl.close();
    try {
      await pool.end();
    } catch (_) {}
    process.exit(0);
  }
}

// =============================================================
// AUTENTICACIÓN EN TERMINAL
// =============================================================
async function handleCliLogin(rl: readline.Interface): Promise<void> {
  console.log('\n--- Iniciar Sesión ---');
  const email = (await rl.question('Correo Electrónico: ')).trim().toLowerCase();
  const password = (await rl.question('Contraseña: ')).trim();

  if (!email || !password) {
    console.log(' Error: Correo y contraseña son obligatorios.');
    return;
  }

  try {
    const [rows]: [any[], any] = await pool.query(
      `SELECT u.*, r.nombre_rol
       FROM usuarios u
       LEFT JOIN roles r ON u.id_rol = r.id_rol
       WHERE LOWER(u.correo) = ? LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      console.log('Error: Usuario no registrado en la base de datos MySQL.');
      return;
    }

    const u = rows[0];
    if (u.contrasena !== password) {
      console.log(' Error: Contraseña incorrecta. Acceso denegado.');
      return;
    }

    activeUser = {
      id: u.id_usuario,
      nombre: u.nombre,
      correo: u.correo,
      rol: u.nombre_rol || (u.id_rol === 3 ? 'administrador' : 'usuario'),
    };

    console.log(`\n ¡Autenticación exitosa! Bienvenido/a ${activeUser.nombre}.`);
  } catch (error: any) {
    console.log(' Error de conexión al verificar credenciales:', error?.message);
  }
}

async function handleCliRegister(rl: readline.Interface): Promise<void> {
  console.log('\n--- Registrar Nuevo Usuario en MySQL ---');
  const name = (await rl.question('Nombre Completo: ')).trim();
  const email = (await rl.question('Correo Electrónico: ')).trim().toLowerCase();
  const password = (await rl.question('Contraseña (mínimo 6 caracteres): ')).trim();
  const rolInput = (await rl.question('Rol [1: Donante/Usuario, 2: Clínica, 3: Administrador] (por defecto 1): ')).trim();

  if (!name || !email || !password) {
    console.log(' Error: Todos los campos son obligatorios.');
    return;
  }

  if (password.length < 6) {
    console.log(' Error: La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  const idRol = rolInput === '3' ? 3 : (rolInput === '2' ? 2 : 1);

  try {
    const [existing]: [any[], any] = await pool.query('SELECT id_usuario FROM usuarios WHERE LOWER(correo) = ?', [email]);
    if (existing.length > 0) {
      console.log(' Error: Ese correo electrónico ya está registrado en MySQL.');
      return;
    }

    const [res]: any = await pool.query(
      'INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)',
      [name, email, password, idRol]
    );

    console.log(` ¡Usuario creado con éxito en MySQL con ID ${res.insertId} y contraseña guardada!`);
  } catch (error: any) {
    console.log(' Error al guardar usuario en MySQL:', error?.message);
  }
}

// =============================================================
// CRUD MEDICAMENTOS EN TERMINAL
// =============================================================
async function menuMedicamentos(rl: readline.Interface): Promise<void> {
  while (true) {
    console.log('\n---  GESTIÓN DE MEDICAMENTOS (MYSQL) ---');
    console.log('[1] Listar catálogo de medicamentos');
    console.log('[2] Crear nuevo medicamento');
    console.log('[3]  Editar medicamento existente');
    console.log('[4]  Eliminar medicamento');
    console.log('[0] Volver al menú principal');

    const opt = (await rl.question('\nOpción: ')).trim();

    if (opt === '1') {
      const [meds]: [any[], any] = await pool.query(
        'SELECT id_medicamento as ID, principio_activo as Principio_Activo, nombre_comercial as Comercial, presentacion as Presentacion, categoria as Categoria, stock_total as Stock, estado as Estado FROM medicamentos ORDER BY id_medicamento ASC'
      );
      console.log(`\n Catálogo de Medicamentos en MySQL (${meds.length} registros):`);
      console.table(meds);
    } else if (opt === '2') {
      console.log('\n--- Nuevo Medicamento ---');
      const active = (await rl.question('Principio Activo: ')).trim();
      const comm = (await rl.question('Nombre Comercial: ')).trim();
      const pres = (await rl.question('Presentación (ej. Tabletas, Cápsulas, Inyectable): ')).trim() || 'Tabletas';
      const cat = (await rl.question('Categoría (ej. Analgésicos, Antibióticos): ')).trim() || 'Analgésicos';
      const stock = parseInt((await rl.question('Stock inicial: ')).trim() || '0', 10);
      const estado = (await rl.question('Estado (ej. en línea, alta demanda) [Enter para en línea]: ')).trim() || 'en línea';

      if (!active || !comm) {
        console.log(' Error: Principio activo y nombre comercial son requeridos.');
        continue;
      }

      const [res]: any = await pool.query(
        'INSERT INTO medicamentos (nombre_comercial, principio_activo, presentacion, categoria, stock_total, estado) VALUES (?, ?, ?, ?, ?, ?)',
        [comm, active, pres, cat, stock, estado]
      );
      console.log(` Medicamento agregado a MySQL exitosamente con ID ${res.insertId}.`);
    } else if (opt === '3') {
      console.log('\n--- Editar Medicamento ---');
      const idStr = (await rl.question('Ingresa el ID del medicamento a editar: ')).trim();
      const id = parseInt(idStr.replace(/\D/g, ''), 10);
      if (isNaN(id)) { console.log(' ID inválido.'); continue; }

      const [rows]: [any[], any] = await pool.query('SELECT * FROM medicamentos WHERE id_medicamento = ?', [id]);
      if (rows.length === 0) { console.log('Medicamento no encontrado.'); continue; }

      const cur = rows[0];
      console.log(`\nValores actuales (presiona Enter para mantener el valor actual):`);
      const newActive = (await rl.question(`Principio Activo [${cur.principio_activo}]: `)).trim() || cur.principio_activo;
      const newComm = (await rl.question(`Nombre Comercial [${cur.nombre_comercial}]: `)).trim() || cur.nombre_comercial;
      const newPres = (await rl.question(`Presentación [${cur.presentacion}]: `)).trim() || cur.presentacion;
      const newCat = (await rl.question(`Categoría [${cur.categoria}]: `)).trim() || cur.categoria;
      const stockInput = (await rl.question(`Stock [${cur.stock_total}]: `)).trim();
      const newStock = stockInput ? parseInt(stockInput, 10) : cur.stock_total;
      const newEstado = (await rl.question(`Estado [${cur.estado}]: `)).trim() || cur.estado;

      await pool.query(
        'UPDATE medicamentos SET nombre_comercial = ?, principio_activo = ?, presentacion = ?, categoria = ?, stock_total = ?, estado = ? WHERE id_medicamento = ?',
        [newComm, newActive, newPres, newCat, newStock, newEstado, id]
      );
      console.log(`¡Medicamento ID ${id} actualizado con éxito en MySQL!`);
    } else if (opt === '4') {
      const idStr = (await rl.question('Ingresa el ID del medicamento a eliminar: ')).trim();
      const id = parseInt(idStr.replace(/\D/g, ''), 10);
      if (isNaN(id)) { console.log(' ID inválido.'); continue; }

      await pool.query('DELETE FROM solicitudes_clinicas WHERE id_medicamento = ?', [id]);
      await pool.query('DELETE FROM donaciones WHERE id_medicamento = ?', [id]);
      await pool.query('DELETE FROM medicamentos WHERE id_medicamento = ?', [id]);
      console.log(` Medicamento ID ${id} eliminado de MySQL.`);
    } else if (opt === '0') {
      break;
    }
  }
}

// =============================================================
// CRUD DONACIONES EN TERMINAL
// =============================================================
async function menuDonaciones(rl: readline.Interface): Promise<void> {
  while (true) {
    console.log('\n---  GESTIÓN DE DONACIONES (MYSQL) ---');
    console.log('[1] Listar donaciones');
    console.log('[2] Registrar nueva donación');
    console.log('[3]  Editar donación (estado, unidades, lote, etc.)');
    console.log('[4] +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ Eliminar donación');
    console.log('[0] Volver al menú principal');

    const opt = (await rl.question('\nOpción: ')).trim();

    if (opt === '1') {
      const [dons]: [any[], any] = await pool.query(
        `SELECT d.id_donacion as ID, m.nombre_comercial as Fármaco, d.numero_lote as Lote,
                d.cantidad_unidades as Unidades, DATE_FORMAT(d.fecha_caducidad, '%Y-%m-%d') as Caducidad,
                d.estado_tramite as Estado, u.nombre as Donante
         FROM donaciones d
         LEFT JOIN usuarios u ON d.id_usuario = u.id_usuario
         LEFT JOIN medicamentos m ON d.id_medicamento = m.id_medicamento
         ORDER BY d.id_donacion DESC`
      );
      console.log(`\n Lista de Donaciones en MySQL (${dons.length} registros):`);
      console.table(dons);
    } else if (opt === '2') {
      console.log('\n--- Registrar Donación ---');
      const comm = (await rl.question('Nombre Comercial del medicamento: ')).trim();
      const active = (await rl.question('Principio Activo: ')).trim();
      const units = parseInt((await rl.question('Cantidad de unidades: ')).trim() || '1', 10);
      const batch = (await rl.question('Número de lote (ej. LOT-2026): ')).trim() || 'LOT-2026';
      const exp = (await rl.question('Fecha de caducidad (AAAA-MM-DD): ')).trim() || '2027-06-30';
      const obs = (await rl.question('Observaciones: ')).trim() || '';

      // Obtener o crear medicamento
      let medId = 1;
      const [mRows]: [any[], any] = await pool.query('SELECT id_medicamento FROM medicamentos WHERE LOWER(nombre_comercial) = ? LIMIT 1', [comm.toLowerCase()]);
      if (mRows.length > 0) {
        medId = mRows[0].id_medicamento;
      } else {
        const [inMed]: any = await pool.query(
          'INSERT INTO medicamentos (nombre_comercial, principio_activo, presentacion, categoria, stock_total, estado) VALUES (?, ?, ?, ?, ?, ?)',
          [comm, active, 'Tabletas', 'Analgésicos', units, 'en línea']
        );
        medId = inMed.insertId;
      }

      const [res]: any = await pool.query(
        'INSERT INTO donaciones (id_usuario, id_medicamento, numero_lote, cantidad_unidades, fecha_caducidad, observaciones, estado_tramite) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [activeUser?.id || 1, medId, batch.toUpperCase(), units, exp, obs, 'Pendiente']
      );
      console.log(` Donación guardada en MySQL con ID ${res.insertId}.`);
    } else if (opt === '3') {
      console.log('\n--- Editar Donación ---');
      const idStr = (await rl.question('Ingresa el ID de la donación a editar: ')).trim();
      const id = parseInt(idStr.replace(/\D/g, ''), 10);
      if (isNaN(id)) { console.log(' ID inválido.'); continue; }

      const [rows]: [any[], any] = await pool.query('SELECT * FROM donaciones WHERE id_donacion = ?', [id]);
      if (rows.length === 0) { console.log(' Donación no encontrada.'); continue; }

      const cur = rows[0];
      console.log(`\nValores actuales (presiona Enter para mantener el valor actual):`);
      const unitsInput = (await rl.question(`Unidades [${cur.cantidad_unidades}]: `)).trim();
      const newUnits = unitsInput ? parseInt(unitsInput, 10) : cur.cantidad_unidades;
      const newBatch = (await rl.question(`Lote [${cur.numero_lote}]: `)).trim() || cur.numero_lote;
      const expFormatted = cur.fecha_caducidad ? new Date(cur.fecha_caducidad).toISOString().split('T')[0] : '2027-01-01';
      const newExp = (await rl.question(`Caducidad [${expFormatted}]: `)).trim() || expFormatted;
      const newStatus = (await rl.question(`Estado (aprobado / pendiente / entregado / rechazado) [${cur.estado_tramite}]: `)).trim() || cur.estado_tramite;
      const newObs = (await rl.question(`Observaciones [${cur.observaciones}]: `)).trim() || cur.observaciones;

      await pool.query(
        'UPDATE donaciones SET cantidad_unidades = ?, numero_lote = ?, fecha_caducidad = ?, estado_tramite = ?, observaciones = ? WHERE id_donacion = ?',
        [newUnits, newBatch, newExp, newStatus, newObs, id]
      );
      console.log(` ¡Donación ID ${id} actualizada con éxito en MySQL!`);
    } else if (opt === '4') {
      const idStr = (await rl.question('Ingresa el ID de la donación a eliminar: ')).trim();
      const id = parseInt(idStr.replace(/\D/g, ''), 10);
      if (isNaN(id)) { console.log(' ID inválido.'); continue; }

      await pool.query('DELETE FROM donaciones WHERE id_donacion = ?', [id]);
      console.log(` Donación ID ${id} eliminada de MySQL.`);
    } else if (opt === '0') {
      break;
    }
  }
}

// =============================================================
// CRUD SOLICITUDES EN TERMINAL
// =============================================================
async function menuSolicitudes(rl: readline.Interface): Promise<void> {
  while (true) {
    console.log('\n---  GESTIÓN DE SOLICITUDES CLÍNICAS (MYSQL) ---');
    console.log('[1] Listar solicitudes clínicas');
    console.log('[2] Registrar nueva solicitud');
    console.log('[3]  Editar solicitud (estado, unidades, etc.)');
    console.log('[4]  Eliminar solicitud');
    console.log('[0] Volver al menú principal');

    const opt = (await rl.question('\nOpción: ')).trim();

    if (opt === '1') {
      const [reqs]: [any[], any] = await pool.query(
        `SELECT s.id_solicitud as ID, u.nombre as Clínica, m.principio_activo as Fármaco,
                s.cantidad_solicitada as Unidades, s.estado_solicitud as Estado,
                DATE_FORMAT(s.fecha_solicitud, '%Y-%m-%d') as Fecha
         FROM solicitudes_clinicas s
         LEFT JOIN usuarios u ON s.id_clinica = u.id_usuario
         LEFT JOIN medicamentos m ON s.id_medicamento = m.id_medicamento
         ORDER BY s.id_solicitud DESC`
      );
      console.log(`\nSolicitudes Clínicas en MySQL (${reqs.length} registros):`);
      console.table(reqs);
    } else if (opt === '2') {
      console.log('\n--- Nueva Solicitud Clínica ---');
      const clinic = (await rl.question('Nombre de la clínica solicitante: ')).trim() || 'Clínica Esperanza';
      const active = (await rl.question('Principio Activo solicitado: ')).trim();
      const units = parseInt((await rl.question('Cantidad de unidades: ')).trim() || '1', 10);

      let medId = 1;
      const [mRows]: [any[], any] = await pool.query('SELECT id_medicamento FROM medicamentos WHERE LOWER(principio_activo) = ? LIMIT 1', [active.toLowerCase()]);
      if (mRows.length > 0) medId = mRows[0].id_medicamento;

      const [res]: any = await pool.query(
        'INSERT INTO solicitudes_clinicas (id_clinica, id_medicamento, cantidad_solicitada, estado_solicitud) VALUES (?, ?, ?, ?)',
        [3, medId, units, 'pendiente']
      );
      console.log(` Solicitud registrada con ID ${res.insertId} en MySQL.`);
    } else if (opt === '3') {
      console.log('\n---  Editar Solicitud Clínica ---');
      const idStr = (await rl.question('Ingresa el ID de la solicitud a editar: ')).trim();
      const id = parseInt(idStr.replace(/\D/g, ''), 10);
      if (isNaN(id)) { console.log(' ID inválido.'); continue; }

      const [rows]: [any[], any] = await pool.query('SELECT * FROM solicitudes_clinicas WHERE id_solicitud = ?', [id]);
      if (rows.length === 0) { console.log('Solicitud no encontrada.'); continue; }

      const cur = rows[0];
      console.log(`\nValores actuales (presiona Enter para mantener el valor actual):`);
      const unitsInput = (await rl.question(`Unidades solicitadas [${cur.cantidad_solicitada}]: `)).trim();
      const newUnits = unitsInput ? parseInt(unitsInput, 10) : cur.cantidad_solicitada;
      const newStatus = (await rl.question(`Estado (pendiente / aprobado / entregado) [${cur.estado_solicitud}]: `)).trim() || cur.estado_solicitud;

      await pool.query(
        'UPDATE solicitudes_clinicas SET cantidad_solicitada = ?, estado_solicitud = ? WHERE id_solicitud = ?',
        [newUnits, newStatus, id]
      );
      console.log(` ¡Solicitud ID ${id} actualizada con éxito en MySQL!`);
    } else if (opt === '4') {
      const idStr = (await rl.question('Ingresa el ID de la solicitud a eliminar: ')).trim();
      const id = parseInt(idStr.replace(/\D/g, ''), 10);
      if (isNaN(id)) { console.log(' ID inválido.'); continue; }

      await pool.query('DELETE FROM solicitudes_clinicas WHERE id_solicitud = ?', [id]);
      console.log(` Solicitud ID ${id} eliminada de MySQL.`);
    } else if (opt === '0') {
      break;
    }
  }
}

// =============================================================
// CRUD USUARIOS EN TERMINAL
// =============================================================
async function menuUsuarios(rl: readline.Interface): Promise<void> {
  while (true) {
    console.log('\n---  GESTIÓN DE USUARIOS Y ROLES (MYSQL) ---');
    console.log('[1] Listar usuarios');
    console.log('[2] Crear nuevo usuario (con contraseña)');
    console.log('[3] Editar usuario (nombre, correo, rol, contraseña)');
    console.log('[4] Eliminar usuario');
    console.log('[0] Volver al menú principal');

    const opt = (await rl.question('\nOpción: ')).trim();

    if (opt === '1') {
      const [usrs]: [any[], any] = await pool.query(
        `SELECT u.id_usuario as ID, u.nombre as Nombre, u.correo as Correo,
                r.nombre_rol as Rol, u.contrasena as Contraseña
         FROM usuarios u
         LEFT JOIN roles r ON u.id_rol = r.id_rol
         ORDER BY u.id_usuario ASC`
      );
      console.log(`\n Lista de Usuarios en MySQL (${usrs.length} registros):`);
      console.table(usrs);
    } else if (opt === '2') {
      console.log('\n--- Crear Usuario con Contraseña ---');
      const name = (await rl.question('Nombre Completo: ')).trim();
      const email = (await rl.question('Correo Electrónico: ')).trim().toLowerCase();
      const password = (await rl.question('Contraseña * (requerida): ')).trim();
      const rolOpt = (await rl.question('Rol [1: Usuario, 2: Clínica, 3: Administrador] (por defecto 1): ')).trim();

      if (!name || !email || !password) {
        console.log(' Error: Nombre, correo y contraseña son obligatorios.');
        continue;
      }

      const idRol = rolOpt === '3' ? 3 : (rolOpt === '2' ? 2 : 1);

      const [existing]: [any[], any] = await pool.query('SELECT id_usuario FROM usuarios WHERE LOWER(correo) = ?', [email]);
      if (existing.length > 0) {
        console.log(' Error: El correo electrónico ya existe.');
        continue;
      }

      const [res]: any = await pool.query(
        'INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)',
        [name, email, password, idRol]
      );
      console.log(` ¡Usuario creado con éxito en MySQL con ID ${res.insertId} y contraseña guardada!`);
    } else if (opt === '3') {
      console.log('\n---  Editar Usuario ---');
      const idStr = (await rl.question('Ingresa el ID del usuario a editar: ')).trim();
      const id = parseInt(idStr.replace(/\D/g, ''), 10);
      if (isNaN(id)) { console.log(' ID inválido.'); continue; }

      const [rows]: [any[], any] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
      if (rows.length === 0) { console.log(' Usuario no encontrado.'); continue; }

      const cur = rows[0];
      console.log(`\nValores actuales (presiona Enter para mantener el valor actual):`);
      const newName = (await rl.question(`Nombre [${cur.nombre}]: `)).trim() || cur.nombre;
      const newEmail = (await rl.question(`Correo [${cur.correo}]: `)).trim() || cur.correo;
      const rolInput = (await rl.question(`Rol (1: Usuario, 2: Clínica, 3: Admin) [${cur.id_rol}]: `)).trim();
      const newIdRol = rolInput ? parseInt(rolInput, 10) : cur.id_rol;
      const newPass = (await rl.question(`Nueva Contraseña [dejar en blanco para mantener actual]: `)).trim() || cur.contrasena;

      await pool.query(
        'UPDATE usuarios SET nombre = ?, correo = ?, contrasena = ?, id_rol = ? WHERE id_usuario = ?',
        [newName, newEmail, newPass, newIdRol, id]
      );
      console.log(` ¡Usuario ID ${id} actualizado con éxito en MySQL!`);
    } else if (opt === '4') {
      const idStr = (await rl.question('Ingresa el ID del usuario a eliminar: ')).trim();
      const id = parseInt(idStr.replace(/\D/g, ''), 10);
      if (isNaN(id)) { console.log(' ID inválido.'); continue; }

      await pool.query('DELETE FROM solicitudes_clinicas WHERE id_clinica = ?', [id]);
      await pool.query('DELETE FROM donaciones WHERE id_usuario = ?', [id]);
      await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
      console.log(`Usuario ID ${id} eliminado de MySQL.`);
    } else if (opt === '0') {
      break;
    }
  }
}

// =============================================================
// VER ESTADO Y ESTADÍSTICAS DB
// =============================================================
async function menuEstadoDb(): Promise<void> {
  console.log('\n---  ESTADO DE CONEXIÓN MYSQL ---');
  try {
    const [tMeds]: any = await pool.query('SELECT COUNT(*) as count FROM medicamentos');
    const [tDons]: any = await pool.query('SELECT COUNT(*) as count FROM donaciones');
    const [tReqs]: any = await pool.query('SELECT COUNT(*) as count FROM solicitudes_clinicas');
    const [tUsrs]: any = await pool.query('SELECT COUNT(*) as count FROM usuarios');

    console.log(`• Host:           ${ENV.DB_HOST}:${ENV.DB_PORT}`);
    console.log(`• Base de Datos:  ${ENV.DB_NAME}`);
    console.log(`• Usuario DB:     ${ENV.DB_USER}`);
    console.log(`• Estado:          Conectado y Operativo`);
    console.log('\nRegistros Actuales en MySQL:');
    console.log(`  - Medicamentos:         ${tMeds[0].count}`);
    console.log(`  - Donaciones:           ${tDons[0].count}`);
    console.log(`  - Solicitudes Clínicas: ${tReqs[0].count}`);
    console.log(`  - Usuarios:             ${tUsrs[0].count}\n`);
  } catch (err: any) {
    console.log(' Error al consultar MySQL:', err?.message || err);
  }
}

// Si se ejecuta directamente desde la terminal (ej: pnpm run panel o npx tsx src/cli/terminal-panel.ts)
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('terminal-panel')) {
  startTerminalPanel().catch((err) => {
    if (err?.code !== 'ERR_USE_AFTER_CLOSE') {
      console.error('Error:', err);
    }
  });
}

