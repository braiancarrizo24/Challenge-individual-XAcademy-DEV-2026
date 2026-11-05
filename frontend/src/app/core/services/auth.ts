
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface AuthUser {
  id: number;
  name?: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/auth';
  private readonly tokenKey = 'fifa_stats_token';
  private readonly userKey = 'fifa_stats_user';

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          sessionStorage.setItem(this.tokenKey, response.access_token);
          sessionStorage.setItem(
            this.userKey,
            JSON.stringify(response.user)
          );
        })
      );
  }

  getProfile(): Observable<AuthUser> {
    return this.http
      .get<AuthUser>(`${this.apiUrl}/profile`)
      .pipe(
        tap((profile) => {
          const currentUser = this.getCurrentUser();

          sessionStorage.setItem(
            this.userKey,
            JSON.stringify({
              ...currentUser,
              ...profile,
            })
          );
        })
      );
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): AuthUser | null {
    const storedUser = sessionStorage.getItem(this.userKey);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
  }
}
