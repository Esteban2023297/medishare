-- ============================================================================
-- ESQUEMA RELACIONAL SQL PARA MEDISHARE (MySQL / MariaDB)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS medishare_db;
USE medishare_db;

-- Desactivar temporalmente restricciones de llaves foráneas para recrear tablas limpiamente
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS solicitudes_clinicas;
DROP TABLE IF EXISTS donaciones;
DROP TABLE IF EXISTS medicamentos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. TABLA DE ROLES
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

-- 2. TABLA DE USUARIOS
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    id_rol INT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

-- 3. TABLA DE MEDICAMENTOS
CREATE TABLE medicamentos (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre_comercial VARCHAR(150) NOT NULL,
    principio_activo VARCHAR(150) NOT NULL,
    presentacion VARCHAR(50) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    stock_total INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'en línea'
);

-- 4. TABLA DE DONACIONES
CREATE TABLE donaciones (
    id_donacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    id_medicamento INT,
    numero_lote VARCHAR(50) NOT NULL,
    cantidad_unidades INT NOT NULL,
    fecha_caducidad DATE NOT NULL,
    observaciones TEXT,
    estado_tramite VARCHAR(30) DEFAULT 'pendiente',
    fecha_donacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);

-- 5. TABLA DE SOLICITUDES CLÍNICAS
CREATE TABLE solicitudes_clinicas (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_clinica INT,
    id_medicamento INT,
    cantidad_solicitada INT NOT NULL,
    estado_solicitud VARCHAR(30) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_clinica) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);

-- ============================================================================
-- DATOS SEMILLA INICIALES (SEED DATA)
-- ============================================================================

INSERT INTO roles (nombre_rol) VALUES 
('donante'), 
('clinica'), 
('administrador');

INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES 
('carlos mendoza', 'carlos@email.com', '123456', 1),
('laura gomez', 'laura@email.com', '123456', 1),
('clinica esperanza', 'contacto@esperanza.com', '123456', 2),
('hospital central', 'admin@hospital.com', '123456', 2),
('sofia ruiz', 'sofia@email.com', '123456', 1),
('admin general', 'admin@medishare.com', '123456', 3);

INSERT INTO medicamentos (nombre_comercial, principio_activo, presentacion, categoria, stock_total, estado) VALUES 
('amoxicilina genfar 500mg', 'amoxicilina', 'cápsulas 500mg', 'antibióticos', 240, 'en línea'),
('metformina 850mg', 'metformina', 'tabletas 850mg', 'diabetes', 85, 'alta demanda'),
('enalapril 10mg', 'enalapril', 'tabletas 10mg', 'cardio', 160, 'en línea'),
('omeprazol 20mg', 'omeprazol', 'cápsulas 20mg', 'analgésicos', 312, 'en línea'),
('ibuprofeno 400mg', 'ibuprofeno', 'tabletas 400mg', 'analgésicos', 120, 'en línea'),
('paracetamol 500mg', 'paracetamol', 'tabletas 500mg', 'analgésicos', 200, 'en línea');

INSERT INTO donaciones (id_usuario, id_medicamento, numero_lote, cantidad_unidades, fecha_caducidad, observaciones, estado_tramite) VALUES 
(1, 1, 'ab-2024-001', 30, '2026-03-31', 'empaque sellado y en buenas condiciones', 'aprobado'),
(2, 2, 'mt-2024-002', 45, '2026-01-15', 'caja original sin alteraciones', 'pendiente'),
(5, 3, 'en-2024-003', 50, '2026-07-20', 'excelente estado de almacenamiento', 'en revisión'),
(1, 4, 'om-2024-004', 60, '2026-05-10', 'nuevo y sellado', 'entregado'),
(2, 5, 'ib-2024-005', 40, '2026-09-01', 'vigencia correcta', 'pendiente'),
(5, 6, 'pr-2024-006', 75, '2026-11-30', 'sin abrir', 'aprobado');

INSERT INTO solicitudes_clinicas (id_clinica, id_medicamento, cantidad_solicitada, estado_solicitud) VALUES 
(3, 1, 50, 'pendiente'),
(4, 2, 30, 'aprobado'),
(3, 3, 20, 'entregado'),
(4, 4, 60, 'pendiente'),
(3, 5, 25, 'aprobado'),
(4, 6, 40, 'entregado');