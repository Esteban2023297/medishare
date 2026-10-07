-- ============================================================================
-- esquema relacional sql ampliado para medishare (mysql / mariadb)
-- ============================================================================

create database if not exists medishare_In5bm;
use medishare_In5bm;

-- desactivar temporalmente restricciones de llaves foraneas para recrear tablas limpiamente
set foreign_key_checks = 0;

drop view if exists vista_kpis_donaciones;
drop view if exists vista_resumen_inventario_categoria;
drop view if exists vista_usuarios_roles;
drop view if exists vista_solicitudes_clinicas_detalle;
drop view if exists vista_donaciones_detalle;
drop view if exists vista_medicamentos_disponibles;

drop table if exists solicitudes_clinicas;
drop table if exists donaciones;
drop table if exists medicamentos;
drop table if exists usuarios;
drop table if exists roles;

set foreign_key_checks = 1;

-- 1. tabla de roles
create table roles (
    id_rol int auto_increment primary key,
    nombre_rol varchar(50) not null
);

-- 2. tabla de usuarios
create table usuarios (
    id_usuario int auto_increment primary key,
    nombre varchar(100) not null,
    correo varchar(100) unique not null,
    contrasena varchar(255) not null,
    id_rol int,
    fecha_registro timestamp default current_timestamp,
    foreign key (id_rol) references roles(id_rol)
);

-- 3. tabla de medicamentos
create table medicamentos (
    id_medicamento int auto_increment primary key,
    nombre_comercial varchar(150) not null,
    principio_activo varchar(150) not null,
    presentacion varchar(50) not null,
    categoria varchar(50) not null,
    stock_total int default 0,
    estado varchar(20) default 'en linea'
);

-- 4. tabla de donaciones
create table donaciones (
    id_donacion int auto_increment primary key,
    id_usuario int,
    id_medicamento int,
    numero_lote varchar(50) not null,
    cantidad_unidades int not null,
    fecha_caducidad date not null,
    observaciones text,
    estado_tramite varchar(30) default 'pendiente',
    fecha_donacion timestamp default current_timestamp,
    foreign key (id_usuario) references usuarios(id_usuario),
    foreign key (id_medicamento) references medicamentos(id_medicamento)
);

-- 5. tabla de solicitudes clinicas
create table solicitudes_clinicas (
    id_solicitud int auto_increment primary key,
    id_clinica int,
    id_medicamento int,
    cantidad_solicitada int not null,
    estado_solicitud varchar(30) default 'pendiente',
    fecha_solicitud timestamp default current_timestamp,
    foreign key (id_clinica) references usuarios(id_usuario),
    foreign key (id_medicamento) references medicamentos(id_medicamento)
);

-- ============================================================================
-- datos semilla ampliados (seed data - mas del triple de registros)
-- ============================================================================

insert into roles (nombre_rol) values 
('donante'), 
('clinica'), 
('administrador');

-- usuarios originales (conservados tal cual se solicito)
insert into usuarios (nombre, correo, contrasena, id_rol) values 
('carlos mendoza', 'carlos@email.com', '123456', 1),
('laura gomez', 'laura@email.com', '123456', 1),
('clinica esperanza', 'contacto@esperanza.com', '123456', 2),
('hospital central', 'admin@hospital.com', '123456', 2),
('sofia ruiz', 'sofia@email.com', '123456', 1),
('admin general', 'admin@medishare.com', '123456', 3);

-- medicamentos ampliados (mas del triple: 18 registros)
insert into medicamentos (nombre_comercial, principio_activo, presentacion, categoria, stock_total, estado) values 
('amoxicilina genfar 500mg', 'amoxicilina', 'capsulas 500mg', 'antibioticos', 240, 'en linea'),
('metformina 850mg', 'metformina', 'tabletas 850mg', 'diabetes', 85, 'alta demanda'),
('enalapril 10mg', 'enalapril', 'tabletas 10mg', 'cardio', 160, 'en linea'),
('omeprazol 20mg', 'omeprazol', 'capsulas 20mg', 'analgesicos', 312, 'en linea'),
('ibuprofeno 400mg', 'ibuprofeno', 'tabletas 400mg', 'analgesicos', 120, 'en linea'),
('paracetamol 500mg', 'paracetamol', 'tabletas 500mg', 'analgesicos', 200, 'en linea'),
('loratadina 10mg', 'loratadina', 'tabletas 10mg', 'antihistaminicos', 150, 'en linea'),
('losartan 50mg', 'losartan', 'tabletas 50mg', 'cardio', 95, 'en linea'),
('diclofenaco 50mg', 'diclofenaco', 'tabletas 50mg', 'analgesicos', 180, 'en linea'),
('azitromicina 500mg', 'azitromicina', 'tabletas 500mg', 'antibioticos', 110, 'alta demanda'),
('salbutamol inhalador', 'salbutamol', 'spray 100mcg', 'respiratorio', 75, 'en linea'),
('aspirina 100mg', 'acido acetilsalicilico', 'tabletas 100mg', 'cardio', 220, 'en linea'),
('glibenclamida 5mg', 'glibenclamida', 'tabletas 5mg', 'diabetes', 130, 'en linea'),
('hidroclorotiazida 25mg', 'hidroclorotiazida', 'tabletas 25mg', 'cardio', 90, 'en linea'),
('fluconazol 150mg', 'fluconazol', 'capsulas 150mg', 'antimicoticos', 65, 'en linea'),
('naproxeno 500mg', 'naproxeno', 'tabletas 500mg', 'analgesicos', 140, 'en linea'),
('cetirizina 10mg', 'cetirizina', 'tabletas 10mg', 'antihistaminicos', 210, 'en linea'),
('insulina nph 100ui', 'insulina isofana', 'frasco 10ml', 'diabetes', 50, 'alta demanda');

-- donaciones ampliadas (mas del triple: 18 registros)
insert into donaciones (id_usuario, id_medicamento, numero_lote, cantidad_unidades, fecha_caducidad, observaciones, estado_tramite) values 
(1, 1, 'ab-2024-001', 30, '2026-03-31', 'empaque sellado y en buenas condiciones', 'aprobado'),
(2, 2, 'mt-2024-002', 45, '2026-01-15', 'caja original sin alteraciones', 'pendiente'),
(5, 3, 'en-2024-003', 50, '2026-07-20', 'excelente estado de almacenamiento', 'en revision'),
(1, 4, 'om-2024-004', 60, '2026-05-10', 'nuevo y sellado', 'entregado'),
(2, 5, 'ib-2024-005', 40, '2026-09-01', 'vigencia correcta', 'pendiente'),
(5, 6, 'pr-2024-006', 75, '2026-11-30', 'sin abrir', 'aprobado'),
(1, 7, 'lr-2024-007', 25, '2026-08-14', 'caja en perfecto estado', 'aprobado'),
(2, 8, 'ls-2024-008', 35, '2026-10-05', 'lote verificado', 'pendiente'),
(5, 9, 'dc-2024-009', 50, '2026-04-22', 'sellado de fabrica', 'en revision'),
(1, 10, 'az-2024-010', 20, '2026-12-01', 'caducidad amplia', 'aprobado'),
(2, 11, 'sb-2024-011', 15, '2026-06-18', 'inhalador nuevo', 'entregado'),
(5, 12, 'as-2024-012', 60, '2027-01-10', 'conservado en lugar fresco', 'aprobado'),
(1, 13, 'gl-2024-013', 30, '2026-02-28', 'sin danos aparentes', 'pendiente'),
(2, 14, 'hd-2024-014', 45, '2026-09-15', 'etiqueta legible', 'aprobado'),
(5, 15, 'fl-2024-015', 25, '2026-11-05', 'capsulas intactas', 'en revision'),
(1, 16, 'np-2024-016', 40, '2027-03-20', 'nuevo lote', 'aprobado'),
(2, 17, 'ct-2024-017', 55, '2026-07-11', 'buen estado general', 'pendiente'),
(5, 18, 'in-2024-018', 10, '2026-05-30', 'necesita cadena de frio', 'aprobado');

-- solicitudes clinicas ampliadas (mas del triple: 18 registros)
insert into solicitudes_clinicas (id_clinica, id_medicamento, cantidad_solicitada, estado_solicitud) values 
(3, 1, 50, 'pendiente'),
(4, 2, 30, 'aprobado'),
(3, 3, 20, 'entregado'),
(4, 4, 60, 'pendiente'),
(3, 5, 25, 'aprobado'),
(4, 6, 40, 'entregado'),
(3, 7, 30, 'aprobado'),
(4, 8, 25, 'pendiente'),
(3, 9, 45, 'entregado'),
(4, 10, 15, 'aprobado'),
(3, 11, 20, 'pendiente'),
(4, 12, 50, 'entregado'),
(3, 13, 35, 'aprobado'),
(4, 14, 20, 'pendiente'),
(3, 15, 15, 'entregado'),
(4, 16, 40, 'aprobado'),
(3, 17, 30, 'pendiente'),
(4, 18, 10, 'aprobado');

-- ============================================================================
-- 3. VISTAS SQL RELACIONALES (VIEWS)
-- ============================================================================

-- 3.1. Vista: Fármacos disponibles y semáforo de inventario
create or replace view vista_medicamentos_disponibles as
select 
    id_medicamento,
    nombre_comercial,
    principio_activo,
    presentacion,
    categoria,
    stock_total,
    estado,
    case 
        when stock_total <= 50 then 'Crítico'
        when stock_total <= 100 then 'Bajo'
        else 'Óptimo'
    end as semaforo_stock
from medicamentos;

-- 3.2. Vista: Detalle ampliado de Donaciones con datos de Donante y Medicamento
create or replace view vista_donaciones_detalle as
select 
    d.id_donacion,
    d.id_usuario,
    u.nombre as nombre_donante,
    u.correo as correo_donante,
    d.id_medicamento,
    m.nombre_comercial,
    m.principio_activo,
    m.presentacion,
    m.categoria,
    d.numero_lote,
    d.cantidad_unidades,
    d.fecha_caducidad,
    d.observaciones,
    d.estado_tramite,
    d.fecha_donacion
from donaciones d
inner join usuarios u on d.id_usuario = u.id_usuario
inner join medicamentos m on d.id_medicamento = m.id_medicamento;

-- 3.3. Vista: Detalle ampliado de Solicitudes Clínicas con datos de Clínica e Inventario
create or replace view vista_solicitudes_clinicas_detalle as
select 
    s.id_solicitud,
    s.id_clinica,
    u.nombre as nombre_clinica,
    u.correo as correo_clinica,
    s.id_medicamento,
    m.nombre_comercial,
    m.principio_activo,
    m.presentacion,
    m.stock_total as stock_actual_inventario,
    s.cantidad_solicitada,
    s.estado_solicitud,
    s.fecha_solicitud
from solicitudes_clinicas s
inner join usuarios u on s.id_clinica = u.id_usuario
inner join medicamentos m on s.id_medicamento = m.id_medicamento;

-- 3.4. Vista: Usuarios activos con su Rol del sistema
create or replace view vista_usuarios_roles as
select 
    u.id_usuario,
    u.nombre,
    u.correo,
    u.id_rol,
    r.nombre_rol,
    u.fecha_registro
from usuarios u
inner join roles r on u.id_rol = r.id_rol;

-- 3.5. Vista: Resumen de existencias agrupado por Categoría Terapéutica
create or replace view vista_resumen_inventario_categoria as
select 
    categoria,
    count(id_medicamento) as total_farmacos_distintos,
    coalesce(sum(stock_total), 0) as total_unidades_inventario,
    sum(case when estado = 'alta demanda' then 1 else 0 end) as farmacos_alta_demanda
from medicamentos
group by categoria;

-- 3.6. Vista: KPIs de impacto y estado de Donaciones
create or replace view vista_kpis_donaciones as
select 
    estado_tramite,
    count(id_donacion) as cantidad_donaciones,
    coalesce(sum(cantidad_unidades), 0) as total_unidades_donadas
from donaciones
group by estado_tramite;