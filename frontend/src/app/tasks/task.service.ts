import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TaskItem, TaskPayload, TaskStatus } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/tasks';

  list() {
    return this.http.get<TaskItem[]>(this.url);
  }
  create(payload: TaskPayload) {
    return this.http.post<TaskItem>(this.url, payload);
  }
  update(id: number, payload: TaskPayload) {
    return this.http.put<TaskItem>(`${this.url}/${id}`, payload);
  }
  setStatus(id: number, status: TaskStatus) {
    return this.http.patch<TaskItem>(`${this.url}/${id}/status`, { status });
  }
  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
