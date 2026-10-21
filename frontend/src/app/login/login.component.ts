import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    .wrap { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
    .card { width: 100%; max-width: 380px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 28px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    p.sub { margin: 0 0 20px; color: var(--muted); }
    .btn-primary { width: 100%; }
  `],
  template: `
    <main class="wrap">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h1>Sign in to TaskFlow</h1>
        <p class="sub">Use your account to manage tasks.</p>

        @if (error()) { <div class="alert alert-error" role="alert">{{ error() }}</div> }

        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" autocomplete="username"
                 [class.invalid]="invalid('email')" />
          @if (invalid('email')) {
            <span class="field-error">
              {{ form.controls.email.hasError('required') ? 'Enter your email.' : 'Enter a valid email address.' }}
            </span>
          }
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input id="password" type="password" formControlName="password" autocomplete="current-password"
                 [class.invalid]="invalid('password')" />
          @if (invalid('password')) { <span class="field-error">Enter your password.</span> }
        </div>

        <button class="btn btn-primary" type="submit" [disabled]="loading()">
          {{ loading() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </main>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/tasks']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.status === 401 ? 'Email or password is incorrect.' : errorMessage(err));
      },
    });
  }
}
