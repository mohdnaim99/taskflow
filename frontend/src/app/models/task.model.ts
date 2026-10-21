export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Todo' | 'Done';

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

export interface TaskItem {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null; // yyyy-MM-dd
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: string | null;
}
