import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

const TOKEN_KEY = 'taskflow_token';
const EXPIRY_KEY = 'taskflow_token_expiry';

export interface LoginResponse {
  token: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(EXPIRY_KEY, res.expiresAt);
      }),
    );
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    if (!this.token) return false;
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (expiry && Date.parse(expiry) <= Date.now()) {
      this.clear();
      return false;
    }
    return true;
  }

  logout(): void {
    this.clear();
    this.router.navigate(['/login']);
  }

  private clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }
}
