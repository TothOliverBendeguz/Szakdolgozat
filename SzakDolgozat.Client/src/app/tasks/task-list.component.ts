import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Task, TaskService } from '../services/task.service';
import { AuthService } from '../auth.service';
import { TaskDialogComponent } from '../tasks/task-dialog.component';
import { TaskDetailsDialogComponent } from '../tasks/task-details-dialog.component';
import { User } from '../services/user.service';  


@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="task-list-container">
      <div class="task-list-header">
        <h3>Feladatok</h3>
        <button mat-raised-button color="primary" (click)="openAddTaskDialog()">
          <mat-icon>add</mat-icon>
          Új feladat
        </button>
      </div>

      <table mat-table [dataSource]="tasks" class="task-table">
        <!-- Cím oszlop -->
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Feladat neve</th>
          <td mat-cell *matCellDef="let task" (click)="openTaskDetails(task)" class="clickable">
            {{task.title}}
          </td>
        </ng-container>

        <!-- Státusz oszlop -->
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Státusz</th>
          <td mat-cell *matCellDef="let task">
            <mat-chip [ngClass]="getStatusClass(task.status)">
              {{getStatusText(task.status)}}
            </mat-chip>
          </td>
        </ng-container>

        <!-- Prioritás oszlop -->
        <ng-container matColumnDef="priority">
          <th mat-header-cell *matHeaderCellDef>Prioritás</th>
          <td mat-cell *matCellDef="let task">
            <mat-chip [ngClass]="getPriorityClass(task.priority)">
              {{getPriorityText(task.priority)}}
            </mat-chip>
          </td>
        </ng-container>

        <!-- Határidő oszlop -->
        <ng-container matColumnDef="dueDate">
          <th mat-header-cell *matHeaderCellDef>Határidő</th>
          <td mat-cell *matCellDef="let task" [ngClass]="{'overdue': isOverdue(task)}">
            {{task.dueDate | date:'yyyy.MM.dd'}}
          </td>
        </ng-container>

        <!-- Felelősök oszlop -->
        <ng-container matColumnDef="assignees">
          <th mat-header-cell *matHeaderCellDef>Felelősök</th>
          <td mat-cell *matCellDef="let task">
            <div class="assignees-list">
              <span *ngIf="!task.assignedUsers?.length">Nincs kijelölve</span>
              <span *ngIf="task.assignedUsers?.length">
                {{getAssigneesText(task)}}
              </span>
            </div>
          </td>
        </ng-container>

        <!-- Műveletek oszlop -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Műveletek</th>
          <td mat-cell *matCellDef="let task">
            <button mat-icon-button color="primary" (click)="openTaskDetails(task); $event.stopPropagation()">
              <mat-icon>visibility</mat-icon>
            </button>
            <button mat-icon-button color="accent" (click)="editTask(task); $event.stopPropagation()">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteTask(task); $event.stopPropagation()">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      <div *ngIf="tasks.length === 0" class="no-tasks">
        <p>Nincsenek feladatok ehhez a projekthez. Kattints az "Új feladat" gombra a létrehozáshoz.</p>
      </div>
    </div>
  `,
  styles: [`
    .task-list-container {
      margin: 20px 0;
    }

    .task-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .task-table {
      width: 100%;
    }

    .clickable {
      cursor: pointer;
    }

    .overdue {
      color: #f44336;
      font-weight: bold;
    }

    .assignees-list {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .no-tasks {
      text-align: center;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    /* Státusz osztályok */
    .status-new {
      background-color: #e3f2fd;
      color: #0d47a1;
    }

    .status-in-progress {
      background-color: #fff8e1;
      color: #ff6f00;
    }

    .status-completed {
      background-color: #e8f5e9;
      color: #1b5e20;
    }

    .status-on-hold {
      background-color: #ffebee;
      color: #b71c1c;
    }

    /* Prioritás osztályok */
    .priority-low {
      background-color: #e8f5e9;
      color: #1b5e20;
    }

    .priority-medium {
      background-color: #fff8e1;
      color: #ff6f00;
    }

    .priority-high {
      background-color: #ffebee;
      color: #b71c1c;
    }

    .priority-critical {
      background-color: #b71c1c;
      color: white;
    }
  `]
})
export class TaskListComponent implements OnInit {
  @Input() projectId?: number;
  tasks: Task[] = [];
  displayedColumns = ['title', 'status', 'priority', 'dueDate', 'assignees', 'actions'];

  constructor(
    private taskService: TaskService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    if (this.projectId) {
      this.loadTasks();
    }
  }

  loadTasks(): void {
    if (!this.projectId) return;
    this.taskService.getProjectTasks(this.projectId).subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks;
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
        this.snackBar.open('Hiba történt a feladatok betöltése közben', 'OK', { duration: 3000 });
      }
    });
  }

  openAddTaskDialog(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '600px',
      data: { projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  openTaskDetails(task: Task): void {
    const dialogRef = this.dialog.open(TaskDetailsDialogComponent, {
      width: '700px',
      data: { task: task }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'reload') {
        this.loadTasks();
      }
    });
  }

  editTask(task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '600px',
      data: { task: task, projectId: this.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  deleteTask(task: Task): void {
    if (confirm('Biztosan törölni szeretnéd ezt a feladatot?')) {
      this.taskService.deleteTask(task.id!).subscribe({
        next: () => {
          this.snackBar.open('Feladat sikeresen törölve', 'OK', { duration: 3000 });
          this.loadTasks();
        },
        error: (error: any) => {  // Explicit típus megadása
          console.error('Error deleting task:', error);
          this.snackBar.open('Hiba történt a feladat törlése közben', 'OK', { duration: 3000 });
        }
      });
    }
  }


  getStatusClass(status: string): string {
    switch (status) {
      case 'New': return 'status-new';
      case 'InProgress': return 'status-in-progress';
      case 'Completed': return 'status-completed';
      case 'OnHold': return 'status-on-hold';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'New': return 'Új';
      case 'InProgress': return 'Folyamatban';
      case 'Completed': return 'Kész';
      case 'OnHold': return 'Felfüggesztve';
      default: return status;
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      case 'Critical': return 'priority-critical';
      default: return '';
    }
  }

  getPriorityText(priority: string): string {
    switch (priority) {
      case 'Low': return 'Alacsony';
      case 'Medium': return 'Közepes';
      case 'High': return 'Magas';
      case 'Critical': return 'Kritikus';
      default: return priority;
    }
  }

  isOverdue(task: Task): boolean {
    if (task.status === 'Completed') return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < new Date();
  }

  getAssigneesText(task: Task): string {
    if (!task.assignedUsers || task.assignedUsers.length === 0) {
      return 'Nincs kijelölve';
    }
    return task.assignedUsers.map((user: User) => user.userName).join(', '); 
  }
}
