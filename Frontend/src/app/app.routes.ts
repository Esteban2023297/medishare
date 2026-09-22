import { Routes } from '@angular/router';
import { adminGuard, userGuard } from './core/services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
    title: 'MediShare | Red Sanitaria de Donación de Medicamentos',
  },
  {
    path: 'nosotros',
    loadComponent: () =>
      import('./features/about/about.component').then(
        (m) => m.AboutComponent
      ),
    title: '¿Quiénes Somos? | MediShare',
  },
  {
    path: 'donar',
    loadComponent: () =>
      import('./features/donation/donation-form.component').then(
        (m) => m.DonationFormComponent
      ),
    title: 'Registrar Donación | MediShare',
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(
        (m) => m.CatalogComponent
      ),
    title: 'Catálogo de Clínicas | MediShare',
  },
  {
    path: 'portal-usuario',
    loadComponent: () =>
      import('./features/user-portal/user-portal.component').then(
        (m) => m.UserPortalComponent
      ),
    canActivate: [userGuard],
    title: 'Mi Portal de Usuario | MediShare',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [adminGuard],
    title: 'Panel de Administración y CRUD | MediShare',
  },
  {
    path: 'panel',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    title: 'Trazabilidad y Auditoría | MediShare',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    title: 'Iniciar Sesión | MediShare',
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    title: 'Crear Cuenta | MediShare',
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./features/user-profile/user-profile.component').then(
        (m) => m.UserProfileComponent
      ),
    title: 'Mi Perfil | MediShare',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
