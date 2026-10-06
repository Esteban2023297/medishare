import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { LoginCredentials, RegisterData, User, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // Lista de usuarios sincronizada con MySQL
  private readonly _users = signal<User[]>([]);
  public readonly users = this._users.asReadonly();

  // Usuario autenticado actual
  private readonly _currentUser = signal<User | null>(this._getInitialUser());
  public readonly currentUser = this._currentUser.asReadonly();

  // Señales computadas reactivas
  public readonly isAuthenticated = computed(() => this._currentUser() !== null);
  public readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  public readonly isUser = computed(() => this._currentUser()?.role === 'usuario');

  constructor() {
    this.loadUsers();
  }

  /**
   * Carga los usuarios existentes desde MySQL
   */
  public loadUsers(): void {
    this.apiService.get<{ users: User[] }>('/users').subscribe({
      next: (res) => {
        if (res?.users && res.users.length > 0) {
          this._users.set(res.users);
        }
      },
      error: (err) => console.warn('Error cargando usuarios desde MySQL:', err),
    });
  }

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
    return null;
  }

  public isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Inicia sesión validando estrictamente correo y contraseña contra la base de datos MySQL
   */
  public async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    const normalizedEmail = (credentials.email || '').trim().toLowerCase();

    if (!this.isValidEmail(normalizedEmail)) {
      return { success: false, message: 'El formato de correo no es válido. Debe ser usuario@dominio.extensión' };
    }

    if (!credentials.password || !credentials.password.trim()) {
      return { success: false, message: 'Debes ingresar tu contraseña.' };
    }

    try {
      const res: any = await firstValueFrom(
        this.apiService.post<{ user: User; token: string }>('/auth/login', {
          email: normalizedEmail,
          password: credentials.password,
        })
      );

      if (res?.user) {
        this._setCurrentUser(res.user);
        this.loadUsers();
        return { success: true, message: res.message || `Bienvenido, ${res.user.name}`, user: res.user };
      }

      return { success: false, message: 'Respuesta inválida del servidor.' };
    } catch (err: any) {
      console.warn('Error al iniciar sesión:', err);
      const errMsg = err?.error?.error || err?.message || 'Error al autenticar con el servidor.';
      return { success: false, message: errMsg };
    }
  }

  /**
   * Registra un nuevo usuario con rol y contraseña verificada en MySQL
   */
  public async register(data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    const normalizedEmail = (data.email || '').trim().toLowerCase();

    if (!this.isValidEmail(normalizedEmail)) {
      return { success: false, message: 'Correo electrónico inválido. Introduce un formato válido (ej. usuario@gmail.com, tu@you.com).' };
    }

    if (!data.name || data.name.trim().length < 3) {
      return { success: false, message: 'El nombre completo debe tener al menos 3 caracteres.' };
    }

    if (!data.password || data.password.trim().length < 6) {
      return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    try {
      const res: any = await firstValueFrom(
        this.apiService.post<{ user: User; token: string }>('/auth/register', {
          name: data.name.trim(),
          email: normalizedEmail,
          password: data.password.trim(),
          role: data.role,
          institution: data.institution,
        })
      );

      if (res?.user) {
        this._setCurrentUser(res.user);
        this.loadUsers();
        return { success: true, message: 'Usuario registrado exitosamente en MediShare.', user: res.user };
      }

      return { success: false, message: 'No se pudo completar el registro.' };
    } catch (err: any) {
      console.error('Error al registrar usuario:', err);
      const errMsg = err?.error?.error || err?.message || 'Error al registrar usuario en la base de datos.';
      return { success: false, message: errMsg };
    }
  }

  public logout(): void {
    this._currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('medishare_user');
    }
    this.router.navigate(['/login']);
  }

  public switchUser(user: User): void {
    this._setCurrentUser(user);
  }

  private _setCurrentUser(user: User): void {
    this._currentUser.set(user);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('medishare_user', JSON.stringify(user));
      } catch {
        // Ignorar
      }
    }
  }

  // ==========================================
  // OPERACIONES CRUD DE USUARIOS (ADMIN)
  // ==========================================
  public createUserByAdmin(user: Omit<User, 'id' | 'createdAt'>): User {
    const nextId = `USR-${(this._users().length + 1).toString().padStart(3, '0')}`;
    const newUser: User = {
      ...user,
      id: nextId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this._users.update((prev) => [newUser, ...prev]);

    this.apiService.post<{ user: User }>('/users', user).subscribe({
      next: (res) => {
        if (res?.user) {
          this._users.update((prev) =>
            prev.map((u) => (u.id === nextId ? res.user : u))
          );
        }
      },
      error: (err) => console.error('Error al guardar usuario en MySQL:', err),
    });

    return newUser;
  }

  public updateUser(id: string, updatedData: Partial<User>): void {
    this._users.update((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updatedData } : u))
    );
    if (this._currentUser()?.id === id) {
      this._currentUser.update((current) => (current ? { ...current, ...updatedData } : null));
    }

    this.apiService.put(`/users/${id}`, updatedData).subscribe({
      error: (err) => console.error('Error al actualizar usuario en MySQL:', err),
    });
  }

  public deleteUser(id: string): void {
    this._users.update((prev) => prev.filter((u) => u.id !== id));
    if (this._currentUser()?.id === id) {
      this.logout();
    }

    this.apiService.delete(`/users/${id}`).subscribe({
      error: (err) => console.error('Error al eliminar usuario en MySQL:', err),
    });
  }
}
