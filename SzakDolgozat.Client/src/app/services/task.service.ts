import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User } from './user.service';
export interface TaskAssignment {
  userId: string;
  role: string;
}

export interface Task {
  id?: number;
  projectId: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  startDate: Date | string;
  dueDate: Date | string;
  completedDate?: Date | string;
  createdById?: string;
  createdAt?: Date;
  assignedUsers?: User[];
}

export interface CreateTaskDto {
  projectId: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  startDate: Date | string;
  dueDate: Date | string;
  assignments?: TaskAssignment[];
}

export interface UpdateTaskDto {
  title: string;
  description?: string;
  status: string;
  priority: string;
  startDate: Date | string;
  dueDate: Date | string;
  completedDate?: Date | string;
  assignments?: TaskAssignment[];
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'https://localhost:7294/api/task';

  constructor(private http: HttpClient) { }

  getProjectTasks(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: number, task: UpdateTaskDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, task);
  }

  getDeletedProjectTasks(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/project/${projectId}/deleted`).pipe(
      catchError(error => {
        console.error('Error fetching deleted tasks:', error);
        return [];
      })
    );
  }


  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

