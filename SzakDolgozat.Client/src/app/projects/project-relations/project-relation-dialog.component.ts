import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { Project } from '../../services/project.service';
import { ProjectRelation } from '../../services/project-relation.service';

@Component({
  selector: 'app-project-relation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Új projekt kapcsolat</h2>
    <div mat-dialog-content>
      <form #relationForm="ngForm">
        <div class="source-project">
          <strong>Forrás projekt:</strong> {{data.sourceProjectName}}
        </div>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Kapcsolat típusa</mat-label>
          <mat-select [(ngModel)]="relation.relationType" name="relationType" required>
            <mat-option value="Depends on">Függ tőle</mat-option>
            <mat-option value="Related to">Kapcsolódik hozzá</mat-option>
            <mat-option value="Parent of">Szülője</mat-option>
            <mat-option value="Child of">Al-projekt</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cél projekt</mat-label>
          <mat-select [(ngModel)]="relation.targetProjectId" name="targetProject" required>
            <mat-option *ngFor="let project of availableTargetProjects" [value]="project.id">
              {{project.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Leírás</mat-label>
          <textarea matInput [(ngModel)]="relation.description" name="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Mégsem</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" 
              [disabled]="!relationForm.form.valid">
        Létrehozás
      </button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    .source-project {
      margin-bottom: 15px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 4px;
      font-size: 16px;
    }
  `]
})
export class ProjectRelationDialogComponent {
  relation: ProjectRelation;
  availableTargetProjects: Project[] = [];

  constructor(
    public dialogRef: MatDialogRef<ProjectRelationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      sourceProjectId: number,
      sourceProjectName: string,
      projects: Project[]
    }
  ) {
    this.relation = {
      sourceProjectId: data.sourceProjectId,
      targetProjectId: 0,
      relationType: '',
      description: ''
    };
    this.updateAvailableProjects();
  }

  updateAvailableProjects(): void {
    this.availableTargetProjects = this.data.projects.filter(
      p => p.id !== this.data.sourceProjectId
    );
  }

  onSubmit(): void {
    if (!this.relation.sourceProjectId || !this.relation.targetProjectId || !this.relation.relationType) {
      console.error('Invalid relation data', this.relation);
      return;
    }

    console.log('Submitting relation:', this.relation);
    this.dialogRef.close(this.relation);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
