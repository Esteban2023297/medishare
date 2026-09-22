import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  public readonly authService = inject(AuthService);
  public mobileMenuOpen = signal<boolean>(false);

  public userInitials(): string {
    const name = this.authService.currentUser()?.name || 'US';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  public toggleMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  public closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  public logout(): void {
    this.authService.logout();
  }
}
