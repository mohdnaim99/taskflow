import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PRIORITIES, TaskItem, TaskPayload } from '../models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    form { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    h2 { font-size: 17px; margin-bottom: 14px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .actions { display: flex; gap: 8px; justify-content: flex-end; }
    @media (max-width: 520px) { .row { grid-template-columns: 1fr; } }
  `],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <h2>{{ task ? 'Edit task' : 'New task' }}</h2>

      @if (error) { <div class="alert alert-error" role="alert">{{ error }}</div> }

      <div class="field">
        <label for="title">Title</label>
        <input id="title" formControlName="title" [class.invalid]="invalid('title')" />
        @if (invalid('title')) {
          <span class="field-error">
            {{ form.controls.title.hasError('maxlength') ? 'Title must be 200 characters or fewer.' : 'Enter a title.' }}
          </span>
        }
      </div>

      <div class="field">
        <label for="description">Description (optional)</label>
        <textarea id="description" rows="3" formControlName="description" [class.invalid]="invalid('description')"></textarea>
        @if (invalid('description')) { <span class="field-error">Description must be 2000 characters or fewer.</span> }
      </div>

      <div class="row">
        <div class="field">
          <label for="priority">Priority</label>
          <select id="priority" formControlName="priority">
            @for (p of priorities; track p) { <option [value]="p">{{ p }}</option> }
          </select>
        </div>
        <div class="field">
          <label for="dueDate">Due date (optional)</label>
          <input id="dueDate" type="date" formControlName="dueDate" />
        </div>
      </div>

      <div class="actions">
        <button class="btn" type="button" (click)="cancel.emit()" [disabled]="saving">Cancel</button>
        <button class="btn btn-primary" type="submit" [disabled]="saving">
          {{ saving ? 'Saving...' : (task ? 'Save changes' : 'Create task') }}
        </button>
      </div>
    </form>
  `,
})
export class TaskFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  @Input() task: TaskItem | null = null;
  @Input() saving = false;
  @Input() error: string | null = null;
  @Output() save = new EventEmitter<TaskPayload>();
  @Output() cancel = new EventEmitter<void>();

  readonly priorities = PRIORITIES;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]],
    description: ['', [Validators.maxLength(2000)]],
    priority: ['Medium' as TaskItem['priority']],
    dueDate: [''],
  });

  ngOnInit(): void {
    if (this.task) {
      this.form.patchValue({
        title: this.task.title,
        description: this.task.description ?? '',
        priority: this.task.priority,
        dueDate: this.task.dueDate ?? '',
      });
    }
  }

  invalid(name: 'title' | 'description'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.save.emit({
      title: v.title.trim(),
      description: v.description.trim() || null,
      priority: v.priority,
      dueDate: v.dueDate || null,
    });
  }
}
