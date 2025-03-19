import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Task } from '../services/task.service';
import { TaskDialogComponent } from './task-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-task-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>Feladat részletei</h2>
    <div mat-dialog-content>
      <div class="task-header">
        <h3 class="task-title">{{task.title}}</h3>
        <div class="task-badges">
          <mat-chip [ngClass]="getStatusClass(task.status)">
            {{getStatusText(task.status)}}
          </mat-chip>
          <mat-chip [ngClass]="getPriorityClass(task.priority)">
            {{getPriorityText(task.priority)}}
          </mat-chip>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="task-dates">
        <div class="date-item">
          <mat-icon>calendar_today</mat-icon>
          <span>Kezdés: {{task.startDate | date:'yyyy.MM.dd'}}</span>
        </div>
        <div class="date-item" [ngClass]="{'overdue': isOverdue(task)}">
          <mat-icon>event</mat-icon>
          <span>Határidő: {{task.dueDate | date:'yyyy.MM.dd'}}</span>
        </div>
        <div class="date-item" *ngIf="task.completedDate">
          <mat-icon>check_circle</mat-icon>
          <span>Befejezve: {{task.completedDate | date:'yyyy.MM.dd'}}</span>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="task-description">
        <h4>Leírás</h4>
        <p *ngIf="task.description">{{task.description}}</p>
        <p *ngIf="!task.description" class="no-data">Nincs leírás megadva</p>
      </div>

      <div class="task-assignments">
        <h4>Hozzárendelések</h4>
        <div *ngIf="task.assignedUsers && task.assignedUsers.length > 0" class="user-list">
          <div *ngFor="let user of task.assignedUsers" class="user-item">
            <mat-icon>person</mat-icon>
            <div class="user-info">
              <span class="user-name">{{user.userName}}</span>
              <span class="user-email">{{user.email}}</span>
            </div>
          </div>
        </div>
        <p *ngIf="!task.assignedUsers || task.assignedUsers.length === 0" class="no-data">
          Nincsenek hozzárendelt felhasználók
        </p>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="editTask()" color="primary">
        <mat-icon>edit</mat-icon> Szerkesztés
      </button>
      <button mat-button (click)="close()">Bezárás</button>
    </div>
  `,
  styles: [`
    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .task-title {
      margin: 0;
      font-size: 20px;
    }

    .task-badges {
      display: flex;
      gap: 8px;
    }

    .task-dates {
      margin: 16px 0;
    }

    .date-item {
      display: flex;
      align-items: center;
      margin: 8px 0;
    }

    .date-item mat-icon {
      margin-right: 8px;
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    .overdue {
      color: #f44336;
      font-weight: bold;
    }

    .task-description, .task-assignments {
      margin: 16px 0;
    }

    h4 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 16px;
      font-weight: 500;
    }

    .no-data {
      color: rgba(0, 0, 0, 0.54);
      font-style: italic;
    }

    .user-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .user-item {
      display: flex;
      align-items: center;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .user-item mat-icon {
      margin-right: 8px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
    }

    .user-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }

    mat-divider {
      margin: 16px 0;
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
export class TaskDetailsDialogComponent implements OnInit {
  task: Task;

  constructor(
    public dialogRef: MatDialogRef<TaskDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task: Task },
    private dialog: MatDialog
  ) {
    this.task = data.task;
  }

  ngOnInit(): void {
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

  editTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '600px',
      data: { task: this.task, projectId: this.task.projectId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close('reload');
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
