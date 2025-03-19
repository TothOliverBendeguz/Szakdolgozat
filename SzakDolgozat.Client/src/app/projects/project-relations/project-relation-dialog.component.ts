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
    <h2 mat-dialog-title>{{data.isNew ? 'Új projekt kapcsolat' : 'Kapcsolat szerkesztése'}}</h2>
    <div mat-dialog-content>
      <form #relationForm="ngForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Forrás projekt</mat-label>
          <mat-select [(ngModel)]="relation.sourceProjectId" name="sourceProject" required 
                     [disabled]="!data.isNew && data.relation.sourceProjectId !== null">
            <mat-option *ngFor="let project of availableSourceProjects" [value]="project.id">
              {{project.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Kapcsolat típusa</mat-label>
          <mat-select [(ngModel)]="relation.relationType" name="relationType" required>
            <mat-option value="Depends on">Függ tőle</mat-option>
            <mat-option value="Related to">Kapcsolódik hozzá</mat-option>
            <mat-option value="Parent of">Szülője</mat-option>
            <mat-option value="Child of">Gyermeke</mat-option>
            <mat-option value="Blocks">Blokkolja</mat-option>
            <mat-option value="Is blocked by">Blokkolva van általa</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cél projekt</mat-label>
          <mat-select [(ngModel)]="relation.targetProjectId" name="targetProject" required
                     [disabled]="!data.isNew && data.relation.targetProjectId !== null">
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
        {{data.isNew ? 'Létrehozás' : 'Mentés'}}
      </button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
  `]
})
export class ProjectRelationDialogComponent {
  relation: ProjectRelation;
  availableSourceProjects: Project[] = [];
  availableTargetProjects: Project[] = [];

  constructor(
    public dialogRef: MatDialogRef<ProjectRelationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      relation: ProjectRelation,
      projects: Project[],
      isNew: boolean
    }
  ) {
    this.relation = { ...data.relation };
    this.updateAvailableProjects();
  }

  updateAvailableProjects(): void {
    this.availableSourceProjects = [...this.data.projects];
    this.availableTargetProjects = this.relation.sourceProjectId
      ? this.data.projects.filter(p => p.id !== this.relation.sourceProjectId)
      : [...this.data.projects];
  }

  onSubmit(): void {
    this.dialogRef.close(this.relation);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
