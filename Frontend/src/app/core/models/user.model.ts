export type UserRole = 'admin' | 'usuario';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  institution?: string; // Para usuarios clínicos o institucionales
  status: 'Activo' | 'Inactivo' | 'Pendiente';
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  institution?: string;
}
