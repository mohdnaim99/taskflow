import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';
import { TaskItem, TaskPayload } from '../models/task.model';
import { TaskFormComponent } from './task-form.component';
import { TaskService } from './task.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [DatePipe, TaskFormComponent],
  styles: [`
    header { background: var(--surface); border-bottom: 1px solid var(--border); }
    .bar, main { max-width: 960px; margin: 0 auto; padding: 14px 16px; }
    .bar { display: flex; justify-content: space-between; align-items: center; }
    .bar h1 { font-size: 19px; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .toolbar h2 { font-size: 17px; }
    .table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
    th { font-size: 13px; color: var(--muted); font-weight: 600; background: #fafbfc; }
    tr:last-child td { border-bottom: 0; }
    .title { font-weight: 600; }
    .desc { color: var(--muted); font-size: 13px; margin-top: 2px; }
    .done .title { text-decoration: line-through; color: var(--muted); }
    .tag { display: inline-block; padding: 1px 8px; border-radius: 99px; font-size: 12px; border: 1px solid var(--border); }
    .p-High { background: var(--danger-bg); color: var(--danger); border-color: #fecdca; }
    .p-Medium { background: var(--warn-bg); color: var(--warn); border-color: #fedf89; }
    .p-Low { background: #f2f4f7; color: var(--muted); }
    .s-Done { background: var(--ok-bg); color: var(--ok); border-color: #abefc6; }
    .overdue { color: var(--danger); font-weight: 600; }
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .state { padding: 36px 16px; text-align: center; color: var(--muted); }
  `],
  template: `
    <header>
      <div class="bar">
        <h1>TaskFlow</h1>
        <button class="btn btn-sm" (click)="auth.logout()">Sign out</button>
      </div>
    </header>

    <main>
      @if (formMode() !== null) {
        <app-task-form
          [task]="editing()"
          [saving]="saving()"
          [error]="formError()"
          (save)="save($event)"
          (cancel)="closeForm()" />
      }

      <div class="toolbar">
        <h2>Your tasks</h2>
        @if (formMode() === null) {
          <button class="btn btn-primary" (click)="openCreate()">New task</button>
        }
      </div>

      @if (error()) {
        <div class="alert alert-error" role="alert">
          {{ error() }} <button class="btn btn-sm" (click)="load()">Retry</button>
        </div>
      }

      @if (loading()) {
        <div class="state" aria-live="polite">Loading tasks...</div>
      } @else if (!tasks().length && !error()) {
        <div class="state">No tasks yet. Select "New task" to add your first one.</div>
      } @else if (tasks().length) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Task</th><th>Priority</th><th>Due</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              @for (t of tasks(); track t.id) {
                <tr [class.done]="t.status === 'Done'">
                  <td>
                    <div class="title">{{ t.title }}</div>
                    @if (t.description) { <div class="desc">{{ t.description }}</div> }
                  </td>
                  <td><span [class]="'tag p-' + t.priority">{{ t.priority }}</span></td>
                  <td>
                    @if (t.dueDate) {
                      <span [class.overdue]="isOverdue(t)">{{ t.dueDate | date: 'mediumDate' }}</span>
                    } @else { <span class="desc">-</span> }
                  </td>
                  <td><span [class]="'tag s-' + t.status">{{ t.status }}</span></td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-sm" (click)="toggle(t)" [disabled]="busyId() === t.id">
                        {{ t.status === 'Done' ? 'Undo' : 'Mark done' }}
                      </button>
                      <button class="btn btn-sm" (click)="openEdit(t)" [disabled]="busyId() === t.id">Edit</button>
                      <button class="btn btn-sm btn-danger" (click)="remove(t)" [disabled]="busyId() === t.id">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </main>
  `,
})
export class TasksComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(TaskService);

  readonly tasks = signal<TaskItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly formMode = signal<'create' | 'edit' | null>(null);
  readonly editing = signal<TaskItem | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly busyId = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (data) => { this.tasks.set(data); this.loading.set(false); },
      error: (err) => { this.error.set(errorMessage(err)); this.loading.set(false); },
    });
  }

  openCreate(): void { this.editing.set(null); this.formError.set(null); this.formMode.set('create'); }
  openEdit(t: TaskItem): void { this.editing.set(t); this.formError.set(null); this.formMode.set('edit'); }
  closeForm(): void { this.formMode.set(null); this.editing.set(null); this.formError.set(null); }

  save(payload: TaskPayload): void {
    const current = this.editing();
    this.saving.set(true);
    this.formError.set(null);
    const req$ = current ? this.api.update(current.id, payload) : this.api.create(payload);
    req$.subscribe({
      next: (saved) => {
        this.tasks.update((list) =>
          current ? list.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...list]);
        this.saving.set(false);
        this.closeForm();
      },
      error: (err) => { this.saving.set(false); this.formError.set(errorMessage(err)); },
    });
  }

  toggle(t: TaskItem): void {
    this.busyId.set(t.id);
    this.error.set(null);
    this.api.setStatus(t.id, t.status === 'Done' ? 'Todo' : 'Done').subscribe({
      next: (saved) => { this.tasks.update((l) => l.map((x) => (x.id === saved.id ? saved : x))); this.busyId.set(null); },
      error: (err) => { this.error.set(errorMessage(err)); this.busyId.set(null); },
    });
  }

  remove(t: TaskItem): void {
    if (!confirm(`Delete "${t.title}"? This cannot be undone.`)) return;
    this.busyId.set(t.id);
    this.error.set(null);
    this.api.delete(t.id).subscribe({
      next: () => { this.tasks.update((l) => l.filter((x) => x.id !== t.id)); this.busyId.set(null); },
      error: (err) => { this.error.set(errorMessage(err)); this.busyId.set(null); },
    });
  }

  isOverdue(t: TaskItem): boolean {
    if (!t.dueDate || t.status === 'Done') return false;
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return t.dueDate < today;
  }
}
