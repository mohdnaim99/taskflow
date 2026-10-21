import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  template: `
    <main style="padding: 24px">
      <h1>Tasks (placeholder)</h1>
      <p>API responded with {{ count() ?? '…' }} task(s). Token was attached by the interceptor.</p>
      <button class="btn" (click)="auth.logout()">Sign out</button>
    </main>
  `,
})
export class TasksComponent {
  readonly auth = inject(AuthService);
  readonly count = signal<number | null>(null);

  constructor() {
    inject(HttpClient)
      .get<unknown[]>('/api/tasks')
      .subscribe((t) => this.count.set(t.length));
  }
}
