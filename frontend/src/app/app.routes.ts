import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent) },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./tasks/tasks.component').then((m) => m.TasksComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  { path: '**', redirectTo: 'tasks' },
];
