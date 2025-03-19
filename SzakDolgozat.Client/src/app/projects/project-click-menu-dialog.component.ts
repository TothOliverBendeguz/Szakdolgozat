import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '../services/project.service';

@Component({
  selector: 'app-project-click-menu-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{data.project.name}}</h2>
    <div mat-dialog-content>
      <mat-nav-list>
        <a mat-list-item (click)="viewProjectDetails()">
          <mat-icon matListIcon>visibility</mat-icon>
          <span matLine>Projekt részletek megtekintése</span>
        </a>
        <a mat-list-item (click)="viewProjectGraph()">
          <mat-icon matListIcon>account_tree</mat-icon>
          <span matLine>Projekt gráf megjelenítése</span>
        </a>
      </mat-nav-list>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Mégsem</button>
    </div>
  `,
  styles: [`
    h2 {
      margin: 0;
      font-size: 20px;
    }
  `]
})
export class ProjectClickMenuDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProjectClickMenuDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { project: Project }
  ) { }

  viewProjectDetails(): void {
    this.dialogRef.close({ action: 'view' });
  }

  viewProjectGraph(): void {
    this.dialogRef.close({ action: 'filter' });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
