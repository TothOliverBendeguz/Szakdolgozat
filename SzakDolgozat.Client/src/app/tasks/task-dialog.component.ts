import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../auth.service';
import { Task, CreateTaskDto, UpdateTaskDto, TaskService, TaskAssignment } from '../services/task.service';
import { User, UserService } from '../services/user.service';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{isEditMode ? 'Feladat szerkesztése' : 'Új feladat létrehozása'}}</h2>
    <div mat-dialog-content>
      <form #taskForm="ngForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Feladat neve</mat-label>
          <input matInput [(ngModel)]="task.title" name="title" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Feladat leírása</mat-label>
          <textarea matInput [(ngModel)]="task.description" name="description" rows="3"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Státusz</mat-label>
            <mat-select [(ngModel)]="task.status" name="status" required>
              <mat-option value="New">Új</mat-option>
              <mat-option value="InProgress">Folyamatban</mat-option>
              <mat-option value="Completed">Kész</mat-option>
              <mat-option value="OnHold">Felfüggesztve</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Prioritás</mat-label>
            <mat-select [(ngModel)]="task.priority" name="priority" required>
              <mat-option value="Low">Alacsony</mat-option>
              <mat-option value="Medium">Közepes</mat-option>
              <mat-option value="High">Magas</mat-option>
              <mat-option value="Critical">Kritikus</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Kezdő dátum</mat-label>
            <input matInput [matDatepicker]="startPicker" [(ngModel)]="task.startDate" name="startDate" required>
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Határidő</mat-label>
            <input matInput [matDatepicker]="duePicker" [(ngModel)]="task.dueDate" name="dueDate" required>
            <mat-datepicker-toggle matSuffix [for]="duePicker"></mat-datepicker-toggle>
            <mat-datepicker #duePicker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field *ngIf="isEditMode && task.status === 'Completed'" appearance="outline" class="full-width">
          <mat-label>Befejezés dátuma</mat-label>
          <input matInput [matDatepicker]="completedPicker" [(ngModel)]="task.completedDate" name="completedDate">
          <mat-datepicker-toggle matSuffix [for]="completedPicker"></mat-datepicker-toggle>
          <mat-datepicker #completedPicker></mat-datepicker>
        </mat-form-field>

        <div class="user-assignments">
          <h3>Feladat hozzárendelések</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Felhasználó hozzárendelése</mat-label>
            <mat-select [(ngModel)]="selectedUserId" name="selectedUser">
              <mat-option *ngFor="let user of availableUsers" [value]="user.id">
                {{user.userName}} ({{user.email}})
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Szerepkör</mat-label>
            <mat-select [(ngModel)]="selectedRole" name="selectedRole">
              <mat-option value="Responsible">Felelős</mat-option>
              <mat-option value="Contributor">Közreműködő</mat-option>
              <mat-option value="Reviewer">Ellenőrző</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="primary" type="button" (click)="addAssignment()" 
                  [disabled]="!selectedUserId || !selectedRole">
            <mat-icon>add</mat-icon> Hozzáadás
          </button>

          <div class="assigned-users" *ngIf="assignedUsers.length > 0">
            <h4>Hozzárendelt felhasználók</h4>
            <mat-chip-set>
              <mat-chip *ngFor="let assignment of assignedUsers" [removable]="true"
                      (removed)="removeAssignment(assignment)">
                {{getUserName(assignment.userId)}} ({{getRoleText(assignment.role)}})
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Mégsem</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" 
              [disabled]="!taskForm.form.valid">
        {{isEditMode ? 'Mentés' : 'Létrehozás'}}
      </button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }

    .half-width {
      width: 48%;
      margin-bottom: 15px;
    }

    .form-row {
      display: flex;
      justify-content: space-between;
    }

    .user-assignments {
      margin-top: 20px;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }

    .assigned-users {
      margin-top: 15px;
    }

    h3 {
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 16px;
      font-weight: 500;
    }

    h4 {
      margin-top: 15px;
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 500;
    }

    button + button {
      margin-left: 8px;
    }
  `]
})
export class TaskDialogComponent implements OnInit {
  isEditMode = false;
  task: any = {
    projectId: 0,
    title: '',
    description: '',
    status: 'New',
    priority: 'Medium',
    startDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    completedDate: null
  };

  availableUsers: User[] = [];
  assignedUsers: TaskAssignment[] = [];
  selectedUserId: string | null = null;
  selectedRole: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    if (data.projectId) {
      this.task.projectId = data.projectId;
    }

    if (data.task) {
      this.isEditMode = true;
      this.task = { ...data.task };

      // Konvertáljuk a dátumokat Date objektumokká
      this.task.startDate = new Date(this.task.startDate);
      this.task.dueDate = new Date(this.task.dueDate);
      if (this.task.completedDate) {
        this.task.completedDate = new Date(this.task.completedDate);
      }

      // Hozzárendelt felhasználók beállítása
      if (this.task.assignedUsers && this.task.assignedUsers.length > 0) {
        this.task.assignedUsers.forEach((user: User) => {
          // Itt feltételezzük, hogy a szerepkör "Contributor" alapértelmezetten
          // Ezt módosíthatnánk, ha tárolnánk a szerepkört a TaskAssignment entitásban
          this.assignedUsers.push({
            userId: user.id,
            role: 'Contributor'
          });
        });
      }
    }
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {  
        this.availableUsers = users;
      },
      error: (error: any) => {  
        console.error('Error loading users:', error);
        this.snackBar.open('Hiba történt a felhasználók betöltése közben', 'OK', { duration: 3000 });
      }
    });
  }

  addAssignment(): void {
    if (!this.selectedUserId || !this.selectedRole) return;

    // Ellenőrizzük, hogy a felhasználó már hozzá van-e rendelve
    const existingIndex = this.assignedUsers.findIndex(a => a.userId === this.selectedUserId);
    if (existingIndex >= 0) {
      // Frissítjük a szerepkört, ha a felhasználó már hozzá van rendelve
      this.assignedUsers[existingIndex].role = this.selectedRole;
      this.snackBar.open('Felhasználó szerepköre frissítve', 'OK', { duration: 2000 });
    } else {
      // Új hozzárendelés
      this.assignedUsers.push({
        userId: this.selectedUserId,
        role: this.selectedRole
      });
    }

    // Reseteljük a kiválasztásokat
    this.selectedUserId = null;
    this.selectedRole = null;
  }

  removeAssignment(assignment: TaskAssignment): void {
    const index = this.assignedUsers.indexOf(assignment);
    if (index >= 0) {
      this.assignedUsers.splice(index, 1);
    }
  }

  getUserName(userId: string): string {
    const user = this.availableUsers.find(u => u.id === userId);
    return user ? user.userName : 'Ismeretlen felhasználó';
  }

  getRoleText(role: string): string {
    switch (role) {
      case 'Responsible': return 'Felelős';
      case 'Contributor': return 'Közreműködő';
      case 'Reviewer': return 'Ellenőrző';
      default: return role;
    }
  }

  onSubmit(): void {
    if (this.isEditMode) {
      this.updateTask();
    } else {
      this.createTask();
    }
  }

  createTask(): void {
    const taskToCreate: CreateTaskDto = {
      projectId: this.task.projectId,
      title: this.task.title,
      description: this.task.description,
      status: this.task.status,
      priority: this.task.priority,
      startDate: this.task.startDate,
      dueDate: this.task.dueDate,
      assignments: this.assignedUsers
    };

    this.taskService.createTask(taskToCreate).subscribe({
      next: (response: Task) => {  
        this.snackBar.open('Feladat sikeresen létrehozva', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error: any) => {  
        console.error('Error creating task:', error);
        this.snackBar.open('Hiba történt a feladat létrehozása közben', 'OK', { duration: 3000 });
      }
    });
  }

  updateTask(): void {
    const taskToUpdate: UpdateTaskDto = {
      title: this.task.title,
      description: this.task.description,
      status: this.task.status,
      priority: this.task.priority,
      startDate: this.task.startDate,
      dueDate: this.task.dueDate,
      completedDate: this.task.completedDate,
      assignments: this.assignedUsers
    };

    this.taskService.updateTask(this.task.id, taskToUpdate).subscribe({
      next: () => {
        this.snackBar.open('Feladat sikeresen frissítve', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error: any) => {  // Explicit típus megadása
        console.error('Error updating task:', error);
        this.snackBar.open('Hiba történt a feladat frissítése közben', 'OK', { duration: 3000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
