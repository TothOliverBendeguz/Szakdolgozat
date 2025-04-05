import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card'; // Hiányzó import
import { UserService, User } from '../../services/user.service';
import { Project, ProjectUser } from '../../services/project.service';
import { ProjectReport, ProjectReportService } from '../../services/project-report.service';
import { ProjectDocument, ProjectDocumentService } from '../../services/project-document.service';
import { AuthService } from '../../auth.service';
import { TaskListComponent } from '../../tasks/task-list.component';
import { ProjectRelationsComponent } from '../project-relations/project-relations.component';

@Component({
  selector: 'app-project-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatSelectModule,
    MatExpansionModule,
    MatListModule,
    MatTooltipModule,
    MatStepperModule,
    MatTabsModule,
    MatBadgeModule,
    MatDividerModule,
    MatCardModule, // Hiányzó import a komponens imports listájában
    TaskListComponent,
    ProjectRelationsComponent
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon class="title-icon" [ngClass]="{'active-project': data.isActive, 'inactive-project': !data.isActive}">
          {{ data.isActive ? 'check_circle' : 'cancel' }}
        </mat-icon>
        {{ data.name }}
        <div class="title-badge" *ngIf="documents.length > 0 || reports.length > 0">
          <span class="badge-item" *ngIf="documents.length > 0" matTooltip="{{ documents.length }} csatolt dokumentum">
            <mat-icon>attach_file</mat-icon>
            {{ documents.length }}
          </span>
          <span class="badge-item" *ngIf="reports.length > 0" matTooltip="{{ reports.length }} jelentés">
            <mat-icon>description</mat-icon>
            {{ reports.length }}
          </span>
        </div>
      </h2>
      
      <mat-divider></mat-divider>
      
      <mat-dialog-content>
        <mat-tab-group animationDuration="300ms" dynamicHeight>
          <!-- Alapadatok fül -->
          <mat-tab label="Alapadatok">
            <div class="tab-content">
              <div class="project-info-grid">
                <div class="info-group">
                  <h3 class="section-title">Projekt részletek</h3>
                  
                  <div class="info-row">
                    <div class="info-label">Projektvezető:</div>
                    <div class="info-value">{{ data.projectManager }}</div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-label">Állapot:</div>
                    <div class="info-value" [ngClass]="{'status-active': data.isActive, 'status-inactive': !data.isActive}">
                      {{ data.isActive ? 'Aktív' : 'Inaktív' }}
                    </div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-label">Kezdési dátum:</div>
                    <div class="info-value">{{ data.startDate | date:'yyyy. MM. dd. HH:mm' }}</div>
                  </div>
                  
                  <div class="info-row">
                    <div class="info-label">Tervezett befejezés:</div>
                    <div class="info-value" [ngClass]="{'near-deadline': isNearDeadline()}">
                      {{ data.plannedEndDate | date:'yyyy. MM. dd. HH:mm' }}
                      <mat-icon *ngIf="isNearDeadline()" matTooltip="Közeledő határidő" class="deadline-icon">
                        warning
                      </mat-icon>
                    </div>
                  </div>
                  
                  <div class="info-row" *ngIf="data.repository">
                    <div class="info-label">Repository:</div>
                    <div class="info-value">
                      <a [href]="data.repository" target="_blank" class="repo-link">
                        <mat-icon>link</mat-icon>
                        {{ data.repository }}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div class="info-group">
                  <h3 class="section-title">Leírás</h3>
                  <div class="info-description">{{ data.description || 'Nincs megadva leírás' }}</div>
                </div>
              </div>
              
              <mat-divider class="section-divider"></mat-divider>
              
              <div class="assigned-users-section">
                <h3 class="section-title">Projektben résztvevők</h3>
                <div class="assigned-users">
                  <div *ngIf="data.assignedUsers && data.assignedUsers.length > 0" class="user-chips">
                    <mat-chip *ngFor="let user of data.assignedUsers"
                            class="user-chip"
                            [matTooltip]="isOwner(user) ? 'Tulajdonos' : 'Résztvevő'">
                      <div class="user-chip-content">
                        <mat-icon *ngIf="isOwner(user)" class="owner-icon">star</mat-icon>
                        <span>{{ user.userName }}</span>
                        <span class="user-email">{{ user.email }}</span>
                      </div>
                    </mat-chip>
                  </div>
                  <div *ngIf="!data.assignedUsers || data.assignedUsers.length === 0" class="no-users">
                    Nincsenek hozzárendelt felhasználók
                  </div>
                </div>
              </div>
              
              <!-- Csak módosítható mód esetén jelenítjük meg a szerkesztési felületet -->
              <div *ngIf="canEdit" class="edit-section">
                <mat-divider class="section-divider"></mat-divider>
                <h3 class="section-title">Adatok szerkesztése</h3>
                
                <div class="edit-form-container">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Projekt neve</mat-label>
                      <input matInput [(ngModel)]="data.name" name="name">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Projektvezető</mat-label>
                      <input matInput [(ngModel)]="data.projectManager" name="projectManager">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row date-time-section">
                    <mat-form-field appearance="outline" class="date-field">
                      <mat-label>Kezdési dátum</mat-label>
                      <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" name="startDate">
                      <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                      <mat-datepicker #startPicker></mat-datepicker>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="time-field">
                      <mat-label>Kezdési idő</mat-label>
                      <input matInput type="time" [(ngModel)]="startTime" name="startTime">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row date-time-section">
                    <mat-form-field appearance="outline" class="date-field">
                      <mat-label>Tervezett befejezés</mat-label>
                      <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" name="endDate">
                      <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                      <mat-datepicker #endPicker></mat-datepicker>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="time-field">
                      <mat-label>Befejezési idő</mat-label>
                      <input matInput type="time" [(ngModel)]="endTime" name="endTime">
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Leírás</mat-label>
                      <textarea matInput [(ngModel)]="data.description" name="description" rows="4"></textarea>
                    </mat-form-field>
                  </div>
                  
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Repository</mat-label>
                      <input matInput [(ngModel)]="data.repository" name="repository">
                      <mat-icon matSuffix>link</mat-icon>
                    </mat-form-field>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
          
          <!-- Feladatok fül -->
          <mat-tab label="Feladatok">
            <div class="tab-content">
              <app-task-list [projectId]="data.id"></app-task-list>
            </div>
          </mat-tab>
          
          <!-- Dokumentumok fül -->
          <mat-tab label="Dokumentumok" [disabled]="!data.id">
            <div class="tab-content">
              <div class="section-header">
                <h3 class="section-title">Projekt dokumentumok</h3>
                <div *ngIf="canEdit" class="section-actions">
                  <input
                    type="file"
                    #fileInput
                    style="display: none"
                    (change)="onFileSelected($event)"
                  >
                  <button mat-raised-button color="primary" (click)="fileInput.click()">
                    <mat-icon>upload_file</mat-icon>
                    Dokumentum feltöltése
                  </button>
                </div>
              </div>
              
              <div *ngIf="documents.length === 0" class="no-items">
                <mat-icon>folder_open</mat-icon>
                <p>Nincsenek dokumentumok feltöltve ehhez a projekthez</p>
              </div>
              
              <mat-list *ngIf="documents.length > 0" class="documents-list">
                <mat-list-item *ngFor="let doc of documents" class="document-item">
                  <div class="document-info">
                    <div class="document-type-icon">
                      <mat-icon>{{getDocumentIcon(doc.fileName)}}</mat-icon>
                    </div>
                    <div class="document-details">
                      <div class="document-name">{{doc.fileName}}</div>
                      <div class="document-meta">
                        <span class="meta-type">{{getDocumentType(doc.fileName)}}</span>
                        <span class="meta-size">{{formatFileSize(doc.fileSize)}}</span>
                        <span class="meta-date">{{doc.uploadedAt | date:'yyyy.MM.dd. HH:mm'}}</span>
                        <span class="meta-user" *ngIf="doc.createdBy">{{doc.createdBy.userName}}</span>
                      </div>
                    </div>
                    <div class="document-actions">
                      <button mat-icon-button color="primary" (click)="downloadDocument(doc)"
                              matTooltip="Letöltés">
                        <mat-icon>download</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" *ngIf="canEdit"
                              (click)="deleteDocument(doc)"
                              matTooltip="Törlés">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                  <mat-divider></mat-divider>
                </mat-list-item>
              </mat-list>
            </div>
          </mat-tab>
          
          <!-- Jelentések fül -->
          <mat-tab label="Jelentések" [disabled]="!data.id">
            <div class="tab-content">
              <div class="section-header">
                <h3 class="section-title">Projekt jelentések</h3>
                <div *ngIf="canEdit" class="section-actions">
                  <button mat-raised-button color="primary" (click)="openAddReportForm()">
                    <mat-icon>post_add</mat-icon>
                    Új jelentés
                  </button>
                </div>
              </div>
              
              <div *ngIf="showAddReportForm && canEdit" class="report-form">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Új jelentés létrehozása</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Jelentés címe</mat-label>
                      <input matInput [(ngModel)]="newReport.title" required>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Jelentés típusa</mat-label>
                      <mat-select [(ngModel)]="newReport.reportType" required>
                        <mat-option value="Progress">Haladási jelentés</mat-option>
                        <mat-option value="Issue">Probléma jelentés</mat-option>
                        <mat-option value="Milestone">Mérföldkő jelentés</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Tartalom</mat-label>
                      <textarea matInput [(ngModel)]="newReport.content" rows="6" required></textarea>
                    </mat-form-field>
                  </mat-card-content>
                  <mat-card-actions align="end">
                    <button mat-button (click)="cancelReport()">Mégsem</button>
                    <button mat-raised-button color="primary" (click)="submitReport()"
                            [disabled]="!newReport.title || !newReport.content || !newReport.reportType">
                      Jelentés mentése
                    </button>
                  </mat-card-actions>
                </mat-card>
              </div>
              
              <div *ngIf="reports.length === 0 && !showAddReportForm" class="no-items">
                <mat-icon>description</mat-icon>
                <p>Nincsenek jelentések ehhez a projekthez</p>
              </div>
              
              <div *ngIf="reports.length > 0" class="reports-container">
                <mat-accordion>
                  <mat-expansion-panel *ngFor="let report of reports" class="report-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title class="report-title">
                        <span class="report-type-badge" 
                              [ngClass]="{
                                'progress-badge': report.reportType === 'Progress',
                                'issue-badge': report.reportType === 'Issue',
                                'milestone-badge': report.reportType === 'Milestone'
                              }">
                          {{ getReportTypeText(report.reportType) }}
                        </span>
                        {{ report.title }}
                      </mat-panel-title>
                      <mat-panel-description class="report-date">
                        {{ report.createdAt | date:'yyyy.MM.dd. HH:mm' }}
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="report-content">
                      <p>{{ report.content }}</p>
                      <div class="report-footer">
                        <span class="report-author" *ngIf="report.createdBy">
                          Készítette: {{ report.createdBy.userName }}
                        </span>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </mat-accordion>
              </div>
            </div>
          </mat-tab>
          
          <!-- Kapcsolatok fül -->
          <mat-tab label="Kapcsolatok" [disabled]="!data.id">
            <div class="tab-content">
              <app-project-relations [projectId]="data.id"></app-project-relations>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>
      
      <mat-divider></mat-divider>
      
      <mat-dialog-actions align="end">
        <button mat-stroked-button color="primary" (click)="toggleStatus()" *ngIf="canToggleStatus()">
          {{data.isActive ? 'Deaktiválás' : 'Aktiválás'}}
        </button>
        <button mat-stroked-button color="primary" (click)="saveChanges()" *ngIf="canEdit">
          Változtatások mentése
        </button>
        <button mat-button color="basic" (click)="close()">Bezárás</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    
    mat-dialog-content {
      max-height: calc(90vh - 128px);
      overflow-y: auto;
    }
    
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 24px;
      margin-bottom: 16px;
    }
    
    .title-icon {
      margin-right: 8px;
    }
    
    .active-project {
      color: #4CAF50;
    }
    
    .inactive-project {
      color: #F44336;
    }
    
    .title-badge {
      margin-left: auto;
      display: flex;
      gap: 12px;
    }
    
    .badge-item {
      display: flex;
      align-items: center;
      background-color: #f0f0f0;
      border-radius: 16px;
      padding: 4px 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.7);
    }
    
    .badge-item mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
    
    .section-divider {
      margin: 24px 0;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.8);
    }
    
    .tab-content {
      padding: 24px 8px;
    }
    
    .status-active {
      color: #4CAF50;
      font-weight: 500;
    }
    
    .status-inactive {
      color: #F44336;
      font-weight: 500;
    }
    
    .near-deadline {
      color: #FF9800;
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    
    .deadline-icon {
      color: #F44336;
      margin-left: 8px;
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    .project-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 12px;
    }
    
    .info-label {
      width: 160px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }
    
    .info-value {
      flex: 1;
    }
    
    .info-description {
      background-color: #f9f9f9;
      padding: 16px;
      border-radius: 4px;
      border-left: 4px solid #2196F3;
      white-space: pre-line;
      min-height: 100px;
    }
    
    .repo-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #2196F3;
      text-decoration: none;
    }
    
    .repo-link:hover {
      text-decoration: underline;
    }
    
    .assigned-users-section {
      margin-top: 24px;
    }
    
    .user-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .user-chip {
      background-color: #e0e0e0;
      border-radius: 16px;
      padding: 4px 8px;
    }
    
    .user-chip-content {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .owner-icon {
      color: #FFD700;
      font-size: 16px;
      height: 16px;
      width: 16px;
    }
    
    .user-email {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-left: 4px;
    }
    
    .no-users {
      color: rgba(0, 0, 0, 0.6);
      font-style: italic;
    }
    
    .edit-section {
      margin-top: 24px;
    }
    
    .edit-form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-row {
      width: 100%;
    }
    
    .full-width {
      width: 100%;
    }
    
    .date-time-section {
      display: flex;
      gap: 16px;
      width: 100%;
    }
    
    .date-field {
      flex: 3;
    }
    
    .time-field {
      flex: 1;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .documents-list {
      padding: 0;
    }
    
    .document-item {
      height: auto !important;
      padding: 12px 0;
    }
    
    .document-info {
      display: flex;
      width: 100%;
      align-items: center;
      gap: 16px;
    }
    
    .document-type-icon {
      color: #607D8B;
    }
    
    .document-details {
      flex: 1;
    }
    
    .document-name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .document-meta {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      display: flex;
      gap: 12px;
    }
    
    .document-actions {
      display: flex;
      gap: 8px;
    }
    
    .no-items {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 0;
      color: rgba(0, 0, 0, 0.5);
    }
    
    .no-items mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      opacity: 0.6;
    }
    
    .report-form {
      margin-bottom: 24px;
    }
    
    .report-panel {
      margin-bottom: 12px;
    }
    
    .report-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .report-type-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      color: white;
    }
    
    .progress-badge {
      background-color: #4CAF50;
    }
    
    .issue-badge {
      background-color: #F44336;
    }
    
    .milestone-badge {
      background-color: #2196F3;
    }
    
    .report-date {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }
    
    .report-content {
      padding: 16px 0;
      white-space: pre-line;
    }
    
    .report-footer {
      display: flex;
      justify-content: flex-end;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 16px;
    }
    
    @media (max-width: 768px) {
      .project-info-grid {
        grid-template-columns: 1fr;
      }
      
      .date-time-section {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class ProjectDetailsDialogComponent implements OnInit {
  canEdit: boolean = false;
  currentUserId: string | null = null;
  reports: ProjectReport[] = [];
  documents: ProjectDocument[] = [];
  newReport: Partial<ProjectReport> = {
    title: '',
    content: '',
    reportType: 'Progress'
  };
  showAddReportForm: boolean = false;

  startDate: Date = new Date();
  startTime: string = '';
  endDate: Date = new Date();
  endTime: string = '';

  constructor(
    public dialogRef: MatDialogRef<ProjectDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Project,
    private reportService: ProjectReportService,
    private userService: UserService,
    public authService: AuthService,
    private documentService: ProjectDocumentService
  ) {
    this.currentUserId = this.authService.getCurrentUserId();

    // Inicializáljuk az assignedUsers tömböt, ha még undefined
    if (!this.data.assignedUsers) {
      this.data.assignedUsers = [];
    }

    // A developer felhasználó szerkesztheti a saját projektjét (tulajdonos vagy létrehozó)
    this.canEdit = this.authService.isAdmin() ||
      (this.authService.isDeveloper() &&
        (this.data.userId === this.currentUserId ||
          this.data.createdById === this.currentUserId));
  }

  ngOnInit() {
    this.initializeDateTimeFields();
    this.loadReports();

    if (this.data.id) {
      this.loadDocuments();
    }
  }

  canToggleStatus(): boolean {
    return this.authService.isAdmin() ||
      (this.authService.isDeveloper() &&
        (this.data.userId === this.currentUserId ||
          this.data.createdById === this.currentUserId));
  }

  isNearDeadline(): boolean {
    if (!this.data.plannedEndDate) return false;

    const now = new Date();
    const deadline = new Date(this.data.plannedEndDate);
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 3600 * 24));

    return diffDays >= 0 && diffDays <= 7;
  }

  initializeDateTimeFields() {
    if (this.data.startDate) {
      const startDateTime = new Date(this.data.startDate);

      this.startDate = new Date(
        startDateTime.getFullYear(),
        startDateTime.getMonth(),
        startDateTime.getDate()
      );

      this.startTime = this.formatTimeFromDate(startDateTime);
    }

    if (this.data.plannedEndDate) {
      const endDateTime = new Date(this.data.plannedEndDate);

      this.endDate = new Date(
        endDateTime.getFullYear(),
        endDateTime.getMonth(),
        endDateTime.getDate()
      );

      this.endTime = this.formatTimeFromDate(endDateTime);
    }
  }

  formatTimeFromDate(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  loadReports() {
    if (!this.data.id) return;

    this.reportService.getProjectReports(this.data.id).subscribe({
      next: (reports) => this.reports = reports,
      error: (error) => console.error('Error loading reports:', error)
    });
  }

  loadDocuments() {
    if (!this.data.id) return;

    this.documentService.getProjectDocuments(this.data.id).subscribe({
      next: (docs) => this.documents = docs,
      error: (error) => console.error('Error loading documents:', error)
    });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && this.data.id) {
      this.documentService.uploadDocument(this.data.id, file).subscribe({
        next: (doc) => {
          this.documents.push(doc);
          target.value = '';
        },
        error: (error) => console.error('Error uploading document:', error)
      });
    }
  }

  downloadDocument(doc: ProjectDocument) {
    this.documentService.downloadDocument(doc.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  deleteDocument(doc: ProjectDocument) {
    if (confirm('Biztosan törölni szeretnéd ezt a dokumentumot?')) {
      this.documentService.deleteDocument(doc.id).subscribe({
        next: () => {
          const index = this.documents.indexOf(doc);
          if (index > -1) {
            this.documents.splice(index, 1);
          }
        },
        error: (error) => console.error('Error deleting document:', error)
      });
    }
  }

  openAddReportForm() {
    this.showAddReportForm = true;
    this.newReport = {
      title: '',
      content: '',
      reportType: 'Progress'
    };
  }

  cancelReport() {
    this.showAddReportForm = false;
  }

  submitReport() {
    if (!this.newReport.title || !this.newReport.content || !this.data.id || !this.newReport.reportType) {
      return;
    }

    const report: ProjectReport = {
      projectId: this.data.id,
      title: this.newReport.title,
      content: this.newReport.content,
      reportType: this.newReport.reportType
    };

    this.reportService.createReport(report).subscribe({
      next: () => {
        this.loadReports();
        this.showAddReportForm = false;
      },
      error: (error) => {
        console.error('Error creating report:', error);
      }
    });
  }

  getReportTypeText(type: string): string {
    switch (type) {
      case 'Progress': return 'Haladási';
      case 'Issue': return 'Probléma';
      case 'Milestone': return 'Mérföldkő';
      default: return type;
    }
  }

  isOwner(user: User | ProjectUser): boolean {
    return user.id === this.data.userId || user.id === this.data.createdById;
  }

  getDocumentIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (['pdf'].includes(ext)) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    if (['ppt', 'pptx'].includes(ext)) return 'slideshow';
    if (['txt', 'rtf'].includes(ext)) return 'text_snippet';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'image';

    return 'insert_drive_file';
  }

  getDocumentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (['pdf'].includes(ext)) return 'PDF dokumentum';
    if (['doc', 'docx'].includes(ext)) return 'Word dokumentum';
    if (['xls', 'xlsx'].includes(ext)) return 'Excel táblázat';
    if (['csv'].includes(ext)) return 'CSV fájl';
    if (['ppt', 'pptx'].includes(ext)) return 'PowerPoint prezentáció';
    if (['txt'].includes(ext)) return 'Szöveges dokumentum';
    if (['rtf'].includes(ext)) return 'Rich Text dokumentum';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'Kép';

    return ext.toUpperCase() + ' fájl';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  toggleStatus(): void {
    if (!this.canToggleStatus()) {
      return;
    }

    // Állítsuk be a projekt új állapotát
    this.data.isActive = !this.data.isActive;

    // Zárjuk be a dialógust a frissített projekttel
    this.dialogRef.close({
      action: 'toggle',
      project: this.data
    });
  }

  saveChanges(): void {
    if (!this.canEdit) {
      return;
    }

    try {
      const combinedStartDateTime = this.createExactDateTime(this.startDate, this.startTime);
      const combinedEndDateTime = this.createExactDateTime(this.endDate, this.endTime);

      this.data.startDate = combinedStartDateTime;
      this.data.plannedEndDate = combinedEndDateTime;

      // Biztosítjuk, hogy a hozzárendelt felhasználók tömb létezik
      if (!this.data.assignedUsers) {
        this.data.assignedUsers = [];
      }

      // Biztosítjuk, hogy a létrehozó benne van a hozzárendelt felhasználók között
      if (this.currentUserId && !this.data.assignedUsers.some(u => u.id === this.currentUserId)) {
        const currentUser = this.data.assignedUsers.find(u => u.id === this.currentUserId);
        if (currentUser) {
          this.data.assignedUsers.push(currentUser);
        }
      }

      this.dialogRef.close({ action: 'save', project: this.data });
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Hiba történt a módosítások mentésekor.');
    }
  }

  createExactDateTime(date: Date, timeString: string): Date {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const [hours, minutes] = timeString.split(':').map(Number);

    const result = new Date(year, month, day, hours, minutes, 0, 0);
    return result;
  }

  close(): void {
    this.dialogRef.close();
  }
}
