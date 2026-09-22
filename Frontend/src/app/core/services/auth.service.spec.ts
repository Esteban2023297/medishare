import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('Servicio de Autenticación y Roles: AuthService', () => {
  let service: AuthService;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      navigate: () => Promise.resolve(true),
    };
    service = new AuthService(mockRouter);
  });

  it('debe validar correos con cualquier extensión de dominio (@gmail.com, @you.com, @salud.org, etc.)', () => {
    expect(service.isValidEmail('usuario@gmail.com')).toBe(true);
    expect(service.isValidEmail('contacto@you.com')).toBe(true);
    expect(service.isValidEmail('dra.morales@hospital.comunitario.org')).toBe(true);
    expect(service.isValidEmail('juan.perez@universidad.edu')).toBe(true);
    expect(service.isValidEmail('correo-invalido')).toBe(false);
    expect(service.isValidEmail('sin-arroba.com')).toBe(false);
  });

  it('debe iniciar sesión correctamente para un Administrador', () => {
    const res = service.login({ email: 'admin@medishare.org' });
    expect(res.success).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(service.currentUser()?.role).toBe('admin');
  });

  it('debe iniciar sesión correctamente para un Usuario estándar', () => {
    const res = service.login({ email: 'maria@gmail.com' });
    expect(res.success).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.currentUser()?.role).toBe('usuario');
  });

  it('debe permitir registrar un nuevo usuario con cualquier extensión de correo y rol asignado', () => {
    const res = service.register({
      name: 'Dr. Roberto Gómez',
      email: 'roberto@you.com',
      role: 'admin',
      institution: 'Clínica Rural',
    });

    expect(res.success).toBe(true);
    expect(service.currentUser()?.email).toBe('roberto@you.com');
    expect(service.currentUser()?.role).toBe('admin');
    expect(service.isAdmin()).toBe(true);
  });

  it('debe gestionar el CRUD de usuarios por parte del Administrador', () => {
    const initialCount = service.users().length;
    const created = service.createUserByAdmin({
      name: 'Paciente Test',
      email: 'test@paciente.net',
      role: 'usuario',
      status: 'Activo',
      institution: 'Comunidad',
    });

    expect(service.users().length).toBe(initialCount + 1);

    // Actualizar rol
    service.updateUser(created.id, { role: 'admin' });
    const updated = service.users().find((u) => u.id === created.id);
    expect(updated?.role).toBe('admin');

    // Eliminar usuario
    service.deleteUser(created.id);
    expect(service.users().some((u) => u.id === created.id)).toBe(false);
  });
});
