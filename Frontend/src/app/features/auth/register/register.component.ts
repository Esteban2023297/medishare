import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserRole } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public isRegistering = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
    role: ['usuario' as UserRole, [Validators.required]],
    institution: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }

  public async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegistering.set(true);
    this.errorMessage.set(null);

    const val = this.registerForm.value;
    const res = await this.authService.register({
      name: val.name,
      email: val.email,
      password: val.password,
      role: val.role,
      institution: val.institution,
    });

    this.isRegistering.set(false);

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
