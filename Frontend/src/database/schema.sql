-- ============================================================================
-- ESQUEMA RELACIONAL SQL PARA MEDISHARE (PostgreSQL 14+)
-- Red Sanitaria y Comunitaria de Donación de Medicamentos
-- Cumplimiento de integridad referencial, roles y barrera sanitaria de 90 días
-- ============================================================================

-- 1. EXTENSIONES Y TIPOS ENUMERADOS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'usuario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE donation_status AS ENUM ('Pendiente', 'Aprobado', 'Entregado', 'En revisión', 'Rechazado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('Pendiente', 'Aprobada', 'En camino', 'Entregada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('Alta', 'Media', 'Baja');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA DE USUARIOS Y ROLES (ADMIN / USUARIO)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'usuario',
    institution VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo', 'Suspendido')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE CATEGORÍAS TERAPÉUTICAS
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 4. TABLA DE CATÁLOGO E INVENTARIO DE MEDICAMENTOS (FÁRMACOS DISPONIBLES)
CREATE TABLE IF NOT EXISTS medicines (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL, -- Ej: CAT-001
    active_ingredient VARCHAR(200) NOT NULL,
    commercial_name VARCHAR(200) NOT NULL,
    presentation VARCHAR(50) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    available_units INT NOT NULL DEFAULT 0 CHECK (available_units >= 0),
    min_expiration_date DATE NOT NULL,
    is_high_demand BOOLEAN NOT NULL DEFAULT FALSE,
    batch_number VARCHAR(50) NOT NULL,
    location VARCHAR(150) DEFAULT 'Centro de Acopio Central',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE DONACIONES (CON RESTRICCIÓN SANITARIA DE CADUCIDAD >= 90 DÍAS)
CREATE TABLE IF NOT EXISTS donations (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL, -- Ej: DON-001
    donor_id VARCHAR(36) REFERENCES users(id) ON DELETE RESTRICT,
    commercial_name VARCHAR(200) NOT NULL,
    active_ingredient VARCHAR(200) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    presentation VARCHAR(50) NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    units INT NOT NULL CHECK (units > 0),
    expiration_date DATE NOT NULL,
    status donation_status NOT NULL DEFAULT 'Pendiente',
    target_clinic_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    donor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricción de seguridad sanitaria:
    -- La caducidad debe ser al menos 90 días posterior a la fecha de registro
    CONSTRAINT chk_sanitary_expiration_rule CHECK (expiration_date >= (created_at::date + INTERVAL '90 days'))
);

-- 6. TABLA DE SOLICITUDES DE CLÍNICAS Y ASOCIACIONES
CREATE TABLE IF NOT EXISTS clinic_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL, -- Ej: SOL-101
    clinic_id VARCHAR(36) REFERENCES users(id) ON DELETE RESTRICT,
    medicine_id VARCHAR(36) REFERENCES medicines(id) ON DELETE RESTRICT,
    requested_units INT NOT NULL CHECK (requested_units > 0),
    urgency urgency_level NOT NULL DEFAULT 'Media',
    status request_status NOT NULL DEFAULT 'Pendiente',
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA DE AUDITORÍA Y TRAZABILIDAD SANITARIA
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'DONATION_REGISTERED', 'STATUS_APPROVED', 'STOCK_DEDUCTED'
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    actor_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ÍNDICES DE RENDIMIENTO PARA FILTROS CLÍNICOS
CREATE INDEX IF NOT EXISTS idx_medicines_active_ingredient ON medicines(LOWER(active_ingredient));
CREATE INDEX IF NOT EXISTS idx_medicines_expiration ON medicines(min_expiration_date);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));

-- ============================================================================
-- DATOS SEMILLA INICIALES (SEED DATA)
-- ============================================================================

-- Categorías
INSERT INTO categories (name, description) VALUES
('Antibióticos', 'Fármacos para el tratamiento de infecciones bacterianas'),
('Diabetes', 'Hipoglucemiantes orales e insulinas'),
('Cardio', 'Antihipertensivos y protectores vasculares'),
('Analgésicos', 'Alivio del dolor e inflamación'),
('Respiratorio', 'Broncodilatadores y antiasmáticos'),
('Gastrointestinal', 'Antiácidos e inhibidores de bomba de protones')
ON CONFLICT (name) DO NOTHING;

-- Usuarios de prueba (Admin y Usuario)
INSERT INTO users (id, name, email, password_hash, role, institution, status) VALUES
('u0000001-0000-0000-0000-000000000001', 'Dr. Alejandro Morales', 'admin@medishare.org', '$2a$12$e8Y54...hash', 'admin', 'MediShare Central', 'Activo'),
('u0000002-0000-0000-0000-000000000002', 'María Rodríguez', 'maria@gmail.com', '$2a$12$e8Y54...hash', 'usuario', 'Donante Particular', 'Activo'),
('u0000003-0000-0000-0000-000000000003', 'Clínica Comunitaria Esperanza', 'contacto@clinicaesperanza.org', '$2a$12$e8Y54...hash', 'usuario', 'Clínica Esperanza', 'Activo')
ON CONFLICT (email) DO NOTHING;
