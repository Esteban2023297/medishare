import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoginCredentials, RegisterData, User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Base de usuarios inicial (incluye cuenta Administrador y Usuario estándar)
  private readonly _users = signal<User[]>([
    {
      id: 'USR-001',
      name: 'Dr. Alejandro Morales',
      email: 'admin@medishare.org',
      role: 'admin',
      institution: 'Ministerio de Salud / MediShare Central',
      status: 'Activo',
      createdAt: '2026-01-15',
    },
    {
      id: 'USR-002',
      name: 'María Rodríguez',
      email: 'maria@gmail.com',
      role: 'usuario',
      institution: 'Donante Particular',
      status: 'Activo',
      createdAt: '2026-03-10',
    },
    {
      id: 'USR-003',
      name: 'Clínica Esperanza',
      email: 'contacto@clinicaesperanza.org',
      role: 'usuario',
      institution: 'Clínica Comunitaria Esperanza',
      status: 'Activo',
      createdAt: '2026-04-01',
    },
    {
      id: 'USR-004',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@yahoo.com',
      role: 'usuario',
      institution: 'Voluntario Comunitario',
      status: 'Activo',
      createdAt: '2026-05-20',
    },
  ]);
  public readonly users = this._users.asReadonly();

  // Usuario autenticado actual (por defecto iniciamos con María Rodríguez como usuario, o nulo si no ha iniciado)
  private readonly _currentUser = signal<User | null>(this._getInitialUser());
  public readonly currentUser = this._currentUser.asReadonly();

  // Señales computadas reactivas
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);
  public readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  public readonly isUser = computed(() => this._currentUser()?.role === 'usuario');

  constructor(private router: Router) {}

  private _getInitialUser(): User | null {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('medishare_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    // Sesión por defecto con María Rodríguez para experiencia lista al cargar
    return this._users()[1];
  }

  /**
   * Validador universal de formato de correo:
   * Acepta cualquier dominio y extensión (@gmail.com, @you.com, @empresa.org, etc.)
   */
  public isValidEmail(email: string): boolean {
    if (!email) return false;
    // Regex estándar RFC 5322 simplificada para admitir cualquier extensión TLD
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Inicia sesión con cualquier correo válido.
   */
  public login(credentials: LoginCredentials): { success: boolean; message: string; user?: User } {
    const normalizedEmail = credentials.email.trim().toLowerCase();

    if (!this.isValidEmail(normalizedEmail)) {
      return { success: false, message: 'El formato de correo no es válido. Debe ser usuario@dominio.extensión' };
    }

    // Buscar si ya existe el usuario
    let foundUser = this._users().find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!foundUser) {
      // Si no existe pero es un correo válido, lo registramos dinámicamente como usuario
      const role: UserRole = normalizedEmail.includes('admin') ? 'admin' : 'usuario';
      const name = normalizedEmail.split('@')[0].replace('.', ' ');
      foundUser = {
        id: `USR-${(this._users().length + 1).toString().padStart(3, '0')}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        email: normalizedEmail,
        role: role,
        status: 'Activo',
        createdAt: new Date().toISOString().split('T')[0],
      };
      this._users.update((list) => [...list, foundUser!]);
    }

    this._setCurrentUser(foundUser);
    return { success: true, message: `Bienvenido, ${foundUser.name}`, user: foundUser };
  }

  /**
   * Registra un nuevo usuario con rol explícito ('admin' o 'usuario') y cualquier extensión de email.
   */
  public register(data: RegisterData): { success: boolean; message: string; user?: User } {
    const normalizedEmail = data.email.trim().toLowerCase();

    if (!this.isValidEmail(normalizedEmail)) {
      return { success: false, message: 'Correo electrónico inválido. Introduce un formato válido (ej. usuario@gmail.com, tu@you.com).' };
    }

    const exists = this._users().some((u) => u.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { success: false, message: 'Este correo electrónico ya está registrado en MediShare.' };
    }

    const newUser: User = {
      id: `USR-${(this._users().length + 1).toString().padStart(3, '0')}`,
      name: data.name.trim(),
      email: normalizedEmail,
      role: data.role,
      institution: data.institution || (data.role === 'admin' ? 'Administración Central' : 'Usuario Particular'),
      status: 'Activo',
      createdAt: new Date().toISOString().split('T')[0],
    };

    this._users.update((list) => [newUser, ...list]);
    this._setCurrentUser(newUser);

    return { success: true, message: 'Usuario registrado exitosamente en MediShare.', user: newUser };
  }

  /**
   * Cierra la sesión activa.
   */
  public logout(): void {
    this._currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('medishare_user');
    }
    this.router.navigate(['/login']);
  }

  /**
   * Cambia rápidamente de rol o usuario para pruebas.
   */
  public switchUser(user: User): void {
    this._setCurrentUser(user);
  }

  private _setCurrentUser(user: User): void {
    this._currentUser.set(user);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('medishare_user', JSON.stringify(user));
      } catch {
        // Ignorar errores de quota en local storage
      }
    }
  }

  // OPERACIONES CRUD DE USUARIOS (Para el panel de administración)
  public createUserByAdmin(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `USR-${(this._users().length + 1).toString().padStart(3, '0')}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this._users.update((prev) => [newUser, ...prev]);
    return newUser;
  }

  public updateUser(id: string, updatedData: Partial<User>): void {
    this._users.update((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updatedData } : u))
    );
    if (this._currentUser()?.id === id) {
      this._currentUser.update((current) => (current ? { ...current, ...updatedData } : null));
    }
  }

  public deleteUser(id: string): void {
    this._users.update((prev) => prev.filter((u) => u.id !== id));
    if (this._currentUser()?.id === id) {
      this.logout();
    }
  }
}
