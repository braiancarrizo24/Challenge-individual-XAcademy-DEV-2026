
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);

  email = '';
  password = '';

  loading = false;
  error = '';

  login(): void {
    this.error = '';

    if (!this.email.trim() || !this.password) {
      this.error = 'Ingresá tu email y contraseña.';
      return;
    }

    this.loading = true;

    this.authService
      .login({
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/players']);
        },
        error: (error) => {
          console.error('Error al iniciar sesión:', error);

          this.loading = false;
          this.error =
            error.error?.message ||
            'No se pudo iniciar sesión. Verificá tus credenciales e intentá nuevamente.';
        },
      });
  }
}




