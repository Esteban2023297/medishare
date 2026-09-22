import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  public isEditing = signal<boolean>(false);
  public saveSuccess = signal<boolean>(false);

  public editName = signal<string>('');
  public editInstitution = signal<string>('');

  public currentUser = computed(() => this.authService.currentUser());

  public userInitials = computed(() => {
    const user = this.currentUser();
    if (!user || !user.name) return 'U';
    return user.name
      .split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  public startEditing(): void {
    const user = this.currentUser();
    if (user) {
      this.editName.set(user.name);
      this.editInstitution.set(user.institution || '');
      this.isEditing.set(true);
      this.saveSuccess.set(false);
    }
  }

  public cancelEditing(): void {
    this.isEditing.set(false);
  }

  public saveProfile(): void {
    const user = this.currentUser();
    if (!user) return;

    if (!this.editName().trim()) return;

    this.authService.updateUser(user.id, {
      name: this.editName().trim(),
      institution: this.editInstitution().trim(),
    });

    this.isEditing.set(false);
    this.saveSuccess.set(true);

    setTimeout(() => {
      this.saveSuccess.set(false);
    }, 4000);
  }

  public logout(): void {
    this.authService.logout();
  }
}
