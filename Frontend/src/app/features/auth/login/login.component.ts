import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#080c14] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        <!-- Logo institucional -->
        <a routerLink="/" class="inline-flex items-center gap-3 group focus:outline-none mb-4">
          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/25">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span class="text-2xl font-extrabold tracking-tight text-white">
            Medi<span class="text-sky-400">Share</span>
          </span>
        </a>

        <h2 class="text-2xl font-extrabold text-white tracking-tight">Acceso a la Plataforma</h2>
        <p class="text-xs text-slate-400 mt-1">
          Ingresa con tu correo institucional o personal (admite cualquier extensión de dominio).
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          
          <!-- Selector rápido de cuentas demo para pruebas -->
          <div class="mb-6 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs">
            <span class="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-2">Acceso Rápido de Prueba:</span>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                (click)="fillDemo('admin')"
                class="px-2.5 py-2 rounded-lg bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800/60 text-sky-300 font-semibold text-center transition-all"
              >
                🔑 Rol Administrador
              </button>
              <button
                type="button"
                (click)="fillDemo('usuario')"
                class="px-2.5 py-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 font-semibold text-center transition-all"
              >
                👤 Rol Usuario / Donante
              </button>
            </div>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
            
            <!-- Campo Correo Electrónico (cualquier extensión) -->
            <div>
              <label for="email" class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Correo Electrónico *</span>
                <span class="text-[10px] text-slate-500 font-mono">&#64;gmail.com, &#64;you.com, etc.</span>
              </label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="ejemplo@gmail.com o usuario@you.com"
                class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              />
              @if (email?.invalid && (email?.dirty || email?.touched)) {
                <p class="text-xs text-rose-400 mt-1">Ingresa un correo electrónico con formato válido.</p>
              }
            </div>

            <!-- Campo Contraseña -->
            <div>
              <label for="password" class="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="••••••••"
                class="w-full bg-[#0c121e] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              />
              @if (password?.invalid && (password?.dirty || password?.touched)) {
                <p class="text-xs text-rose-400 mt-1">La contraseña debe tener al menos 6 caracteres.</p>
              }
            </div>

            <!-- Mensaje de error de login -->
            @if (errorMessage()) {
              <div class="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <!-- Botón de Envío -->
            <div>
              <button
                type="submit"
                [disabled]="loginForm.invalid || isLoggingIn()"
                class="w-full btn-clinical py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
              >
                @if (isLoggingIn()) {
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Autenticando...
                } @else {
                  Ingresar a MediShare
                }
              </button>
            </div>

          </form>

          <!-- Enlace a Registro -->
          <div class="mt-6 pt-5 border-t border-slate-800 text-center">
            <p class="text-xs text-slate-400">
              ¿No tienes una cuenta aún?
              <a routerLink="/registro" class="font-bold text-sky-400 hover:text-sky-300 ml-1 transition-colors">
                Regístrate aquí
              </a>
            </p>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public isLoggingIn = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    password: ['123456', [Validators.required, Validators.minLength(6)]],
  });

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  public fillDemo(role: 'admin' | 'usuario'): void {
    if (role === 'admin') {
      this.loginForm.patchValue({
        email: 'admin@medishare.org',
        password: 'adminpassword',
      });
    } else {
      this.loginForm.patchValue({
        email: 'maria@gmail.com',
        password: 'userpassword',
      });
    }
  }

  public onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoggingIn.set(true);
    this.errorMessage.set(null);

    setTimeout(() => {
      const email = this.loginForm.value.email;
      const res = this.authService.login({ email });

      this.isLoggingIn.set(false);

      if (res.success && res.user) {
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/portal-usuario']);
        }
      } else {
        this.errorMessage.set(res.message);
      }
    }, 450);
  }
}
