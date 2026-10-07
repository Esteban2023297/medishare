import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public isLoggingIn = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  public getEmailErrorMessage(): string {
    if (this.email?.hasError('required')) {
      return 'El correo electrónico es requerido.';
    }
    if (this.email?.hasError('pattern')) {
      return 'Formato de correo inválido (ejemplo: usuario@gmail.com o tu@you.com).';
    }
    return '';
  }

  public getPasswordErrorMessage(): string {
    if (this.password?.hasError('required')) {
      return 'La contraseña es requerida.';
    }
    if (this.password?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return '';
  }

  public fillDemoAccount(emailVal: string): void {
    this.loginForm.patchValue({
      email: emailVal,
      password: '123456',
    });
    this.errorMessage.set(null);
  }

  public async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoggingIn.set(true);
    this.errorMessage.set(null);

    const email = (this.loginForm.value.email || '').trim();
    const password = (this.loginForm.value.password || '').trim();

    const res = await this.authService.login({ email, password });

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
  }
}
