import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ProjectRelation, ProjectRelationService } from '../../services/project-relation.service';
import { Project, ProjectService } from '../../services/project.service';
import { ProjectRelationDialogComponent } from './project-relation-dialog.component';

@Component({
  selector: 'app-project-relations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="relations-container">
      <div class="header">
        <h3>Projekt kapcsolatok</h3>
        <button mat-raised-button color="primary" (click)="openAddRelationDialog()">
          <mat-icon>add_link</mat-icon>
          Új kapcsolat
        </button>
      </div>
      
      <table mat-table [dataSource]="relations" class="relations-table">
        <!-- Forrás projekt oszlop -->
        <ng-container matColumnDef="sourceProject">
          <th mat-header-cell *matHeaderCellDef>Forrás projekt</th>
          <td mat-cell *matCellDef="let relation">{{relation.sourceProjectName}}</td>
        </ng-container>
        
        <!-- Kapcsolat típus oszlop -->
        <ng-container matColumnDef="relationType">
          <th mat-header-cell *matHeaderCellDef>Kapcsolat típusa</th>
          <td mat-cell *matCellDef="let relation">{{relation.relationType}}</td>
        </ng-container>
        
        <!-- Cél projekt oszlop -->
        <ng-container matColumnDef="targetProject">
          <th mat-header-cell *matHeaderCellDef>Cél projekt</th>
          <td mat-cell *matCellDef="let relation">{{relation.targetProjectName}}</td>
        </ng-container>
        
        <!-- Leírás oszlop -->
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Leírás</th>
          <td mat-cell *matCellDef="let relation">{{relation.description}}</td>
        </ng-container>
        
        <!-- Műveletek oszlop -->
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Műveletek</th>
          <td mat-cell *matCellDef="let relation">
            <button mat-icon-button color="primary" (click)="editRelation(relation)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteRelation(relation)">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      
      <div *ngIf="relations.length === 0" class="no-relations">
        <p>Nincsenek projekt kapcsolatok. Kattints az "Új kapcsolat" gombra a létrehozáshoz.</p>
      </div>
    </div>
  `,
  styles: [`
    .relations-container {
      margin: 20px 0;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .relations-table {
      width: 100%;
    }
    
    .no-relations {
      text-align: center;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
  `]
})
export class ProjectRelationsComponent implements OnInit {
  @Input() projectId?: number;

  relations: ProjectRelation[] = [];
  displayedColumns: string[] = ['sourceProject', 'relationType', 'targetProject', 'description', 'actions'];

  constructor(
    private projectRelationService: ProjectRelationService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadRelations();
  }

  loadRelations(): void {
    if (this.projectId) {
      this.projectRelationService.getProjectRelations(this.projectId).subscribe({
        next: (relations) => {
          this.relations = relations;
        },
        error: (error) => {
          console.error('Error loading project relations:', error);
          this.snackBar.open('Hiba történt a kapcsolatok betöltése közben', 'OK', { duration: 3000 });
        }
      });
    } else {
      this.projectRelationService.getAllRelations().subscribe({
        next: (relations) => {
          this.relations = relations;
        },
        error: (error) => {
          console.error('Error loading project relations:', error);
          this.snackBar.open('Hiba történt a kapcsolatok betöltése közben', 'OK', { duration: 3000 });
        }
      });
    }
  }

  openAddRelationDialog(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        const dialogRef = this.dialog.open(ProjectRelationDialogComponent, {
          width: '500px',
          data: {
            relation: {
              sourceProjectId: this.projectId || null,
              targetProjectId: null,
              relationType: '',
              description: ''
            },
            projects: projects,
            isNew: true
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.projectRelationService.createRelation(result).subscribe({
              next: () => {
                this.snackBar.open('Kapcsolat sikeresen létrehozva', 'OK', { duration: 3000 });
                this.loadRelations();
              },
              error: (error) => {
                console.error('Error creating relation:', error);
                this.snackBar.open('Hiba történt a kapcsolat létrehozása közben', 'OK', { duration: 3000 });
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.snackBar.open('Hiba történt a projektek betöltése közben', 'OK', { duration: 3000 });
      }
    });
  }

  editRelation(relation: ProjectRelation): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        const dialogRef = this.dialog.open(ProjectRelationDialogComponent, {
          width: '500px',
          data: {
            relation: { ...relation },
            projects: projects,
            isNew: false
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.projectRelationService.updateRelation(result).subscribe({
              next: () => {
                this.snackBar.open('Kapcsolat sikeresen frissítve', 'OK', { duration: 3000 });
                this.loadRelations();
              },
              error: (error) => {
                console.error('Error updating relation:', error);
                this.snackBar.open('Hiba történt a kapcsolat frissítése közben', 'OK', { duration: 3000 });
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.snackBar.open('Hiba történt a projektek betöltése közben', 'OK', { duration: 3000 });
      }
    });
  }

  deleteRelation(relation: ProjectRelation): void {
    if (confirm('Biztosan törölni szeretnéd ezt a kapcsolatot?')) {
      this.projectRelationService.deleteRelation(relation.id!).subscribe({
        next: () => {
          this.snackBar.open('Kapcsolat sikeresen törölve', 'OK', { duration: 3000 });
          this.loadRelations();
        },
        error: (error) => {
          console.error('Error deleting relation:', error);
          this.snackBar.open('Hiba történt a kapcsolat törlése közben', 'OK', { duration: 3000 });
        }
      });
    }
  }
}
