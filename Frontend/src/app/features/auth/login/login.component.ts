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
