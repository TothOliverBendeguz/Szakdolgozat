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
    TaskListComponent,
    ProjectRelationsComponent

  ],
  template: `
   <div class="dialog-container">
     <h2 mat-dialog-title>Project Details</h2>
     
     <mat-dialog-content>
       <div class="form-container">
         <mat-form-field appearance="outline" class="full-width">
           <mat-label>Project Name</mat-label>
           <input matInput [(ngModel)]="data.name" [readonly]="!canEdit">
         </mat-form-field>

         <mat-form-field appearance="outline" class="full-width">
           <mat-label>Project Manager</mat-label>
           <input matInput [(ngModel)]="data.projectManager" [readonly]="!canEdit">
         </mat-form-field>

         <!-- Dátum és idő mezők -->
         <div class="date-time-section">
           <mat-form-field appearance="outline" class="date-field">
             <mat-label>Start Date</mat-label>
             <input matInput [matDatepicker]="startPicker" [(ngModel)]="startDate" [readonly]="!canEdit">
             <mat-datepicker-toggle matIconSuffix [for]="startPicker" [disabled]="!canEdit"></mat-datepicker-toggle>
             <mat-datepicker #startPicker></mat-datepicker>
           </mat-form-field>

           <mat-form-field appearance="outline" class="time-field">
             <mat-label>Start Time</mat-label>
             <input matInput type="time" [(ngModel)]="startTime" [readonly]="!canEdit">
           </mat-form-field>
         </div>

         <div class="date-time-section">
           <mat-form-field appearance="outline" class="date-field">
             <mat-label>Planned End Date</mat-label>
             <input matInput [matDatepicker]="endPicker" [(ngModel)]="endDate" [readonly]="!canEdit">
             <mat-datepicker-toggle matIconSuffix [for]="endPicker" [disabled]="!canEdit"></mat-datepicker-toggle>
             <mat-datepicker #endPicker></mat-datepicker>
           </mat-form-field>

           <mat-form-field appearance="outline" class="time-field">
             <mat-label>End Time</mat-label>
             <input matInput type="time" [(ngModel)]="endTime" [readonly]="!canEdit">
           </mat-form-field>
         </div>

         <mat-form-field appearance="outline" class="full-width">
           <mat-label>Description</mat-label>
           <textarea matInput [(ngModel)]="data.description" [readonly]="!canEdit" rows="4"></textarea>
         </mat-form-field>

         <mat-form-field appearance="outline" class="full-width">
           <mat-label>Repository URL</mat-label>
           <input matInput [(ngModel)]="data.repository" [readonly]="!canEdit" placeholder="https://github.com/your-repo">
           <a *ngIf="data.repository" [href]="data.repository" target="_blank" matSuffix>
             <mat-icon>open_in_new</mat-icon>
           </a>
         </mat-form-field>

         <mat-form-field appearance="outline" class="full-width">
           <mat-label>Assigned Users</mat-label>
           <mat-select [(ngModel)]="data.assignedUsers" [disabled]="!canEdit" multiple>
             <mat-option *ngFor="let user of availableUsers" [value]="user">
               {{user.email}} ({{user.userName}})
             </mat-option>
           </mat-select>
         </mat-form-field>

        <div class="assigned-users" *ngIf="data.assignedUsers?.length">
            <h4>Assigned Users:</h4>
            <mat-chip-listbox>
                <mat-chip *ngFor="let user of data.assignedUsers"
                          [removable]="canEdit"
                          (removed)="removeUser(user)">
                    {{user.email}}
                    <mat-icon matChipRemove *ngIf="canEdit">cancel</mat-icon>
                </mat-chip>
            </mat-chip-listbox>
        </div>

         <div class="status-section">
           <p>Current Status: 
             <span [class.active-status]="data.isActive" 
                   [class.inactive-status]="!data.isActive">
               {{data.isActive ? 'Active' : 'Inactive'}}
             </span>
           </p>
         </div>

         <!-- Reports section -->
         <div class="reports-section">
           <h3>Project Reports</h3>
           
           <mat-expansion-panel *ngIf="canEdit">
             <mat-expansion-panel-header>
               <mat-panel-title>Add New Report</mat-panel-title>
             </mat-expansion-panel-header>

             <mat-form-field appearance="outline" class="full-width">
               <mat-label>Report Title</mat-label>
               <input matInput [(ngModel)]="newReport.title" required>
             </mat-form-field>

             <mat-form-field appearance="outline" class="full-width">
               <mat-label>Report Type</mat-label>
               <mat-select [(ngModel)]="newReport.reportType" required>
                 <mat-option value="Progress">Progress Report</mat-option>
                 <mat-option value="Issue">Issue Report</mat-option>
                 <mat-option value="Milestone">Milestone Report</mat-option>
               </mat-select>
             </mat-form-field>

             <mat-form-field appearance="outline" class="full-width">
               <mat-label>Content</mat-label>
               <textarea matInput [(ngModel)]="newReport.content" rows="4" required></textarea>
             </mat-form-field>

             <button mat-raised-button color="primary" (click)="submitReport()">
               Submit Report
             </button>
           </mat-expansion-panel>

           <div class="reports-list">
             <mat-expansion-panel *ngFor="let report of reports">
               <mat-expansion-panel-header>
                 <mat-panel-title>
                   {{report.title}}
                   <span class="report-type">{{report.reportType}}</span>
                 </mat-panel-title>
                 <mat-panel-description>
                   {{report.createdAt | date:'medium'}}
                 </mat-panel-description>
               </mat-expansion-panel-header>
               
               <p>{{report.content}}</p>
               <p class="report-author">By: {{report.createdBy?.userName}}</p>
             </mat-expansion-panel>
           </div>
         </div>


<div class="documentation-section">
  <h3>Project Documentation</h3>
  <div class="upload-section" *ngIf="canEdit">
    <input
      type="file"
      #fileInput
      style="display: none"
      (change)="onFileSelected($event)"
    >
    <button
      mat-stroked-button
      color="primary"
      (click)="fileInput.click()"
      [disabled]="!canEdit"
      class="upload-button"
    >
      <mat-icon>upload_file</mat-icon>
      Upload Documentation
    </button>
  </div>

  <div class="tasks-section">
  <h3>Projekt feladatok</h3>
  <app-task-list [projectId]="data.id"></app-task-list>
</div>


  <mat-expansion-panel class="documents-panel">
    <mat-expansion-panel-header>
      <mat-panel-title>
        Uploaded Documents ({{documents.length}})
      </mat-panel-title>
    </mat-expansion-panel-header>

    <div *ngIf="documents.length > 0">
      <mat-list>
        <mat-list-item *ngFor="let doc of documents" class="document-item">
          <mat-icon matListItemIcon>insert_drive_file</mat-icon>
          <div matListItemTitle>{{doc.fileName}}</div>
          <div matListItemLine>
            Uploaded by: {{doc.createdBy?.userName}} |
            {{doc.uploadedAt | date:'medium'}}
          </div>
          <div matListItemMeta>
            <button mat-icon-button color="primary" (click)="downloadDocument(doc)"
                    matTooltip="Download">
              <mat-icon>download</mat-icon>
            </button>
            <button mat-icon-button color="warn" *ngIf="canEdit"
                    (click)="deleteDocument(doc)"
                    matTooltip="Delete">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </mat-list-item>
      </mat-list>
    </div>

    <div *ngIf="documents.length === 0" class="no-documents">
      <p>No documents uploaded yet</p>
    </div>

  </mat-expansion-panel>
</div>

     <mat-dialog-actions align="end">
      <button mat-stroked-button color="primary" (click)="toggleStatus()" *ngIf="authService.isAdmin()">
         {{data.isActive ? 'Deactivate' : 'Activate'}} Project
      </button>
       <button mat-stroked-button color="primary" (click)="saveChanges()" *ngIf="canEdit">
         Save Changes
       </button>
       <button mat-button color="warn" (click)="close()">Close</button>
     </mat-dialog-actions>
   </div>


<div class="project-relations-section">
  <h3>Projekt kapcsolatok</h3>
  <app-project-relations [projectId]="data.id"></app-project-relations>
</div>
 `,
  styles: [`
   .dialog-container {
     padding: 20px;
     min-width: 500px;
   }

   .form-container {
     display: flex;
     flex-direction: column;
     gap: 16px;
   }

   .full-width {
     width: 100%;
   }

   .date-time-section {
     display: flex;
     gap: 16px;
     margin-bottom: 15px;
   }
   
   .date-field {
     flex: 3;
   }
   
   .time-field {
     flex: 1;
   }

   .status-section {
     background-color: #f5f5f5;
     padding: 16px;
     border-radius: 4px;
   }

   .active-status {
     color: #4CAF50;
     font-weight: bold;
   }

   .inactive-status {
     color: #F44336;
     font-weight: bold;
   }

   .documentation-section {
     margin-top: 20px;
     padding-top: 20px;
     border-top: 1px solid #e0e0e0;
   }

   .documentation-section h3 {
     margin: 0 0 16px 0;
     font-size: 16px;
   }

   .upload-button {
     display: flex;
     align-items: center;
     gap: 8px;
   }

   .documentation-note {
     margin-top: 8px;
     color: #666;
     font-style: italic;
   }

   mat-dialog-actions {
     margin-top: 24px;
   }

   a {
     color: #3f51b5;
     text-decoration: none;
   }

   .assigned-users {
     margin-top: 8px;
   }

   mat-chip-listbox {
     display: flex;
     flex-wrap: wrap;
     gap: 8px;
   }

   .reports-section {
     margin-top: 24px;
     border-top: 1px solid #e0e0e0;
     padding-top: 24px;
   }

   .reports-list {
     margin-top: 16px;
   }

   .report-type {
     margin-left: 8px;
     font-size: 0.8em;
     color: #666;
   }

   .report-author {
     font-size: 0.9em;
     color: #666;
     margin-top: 8px;
   }

   .upload-section {
     display: flex;
     align-items: center;
     gap: 16px;
     margin-bottom: 16px;
   }

   .documents-list {
     margin-top: 16px;
   }

   mat-list-item {
     margin-bottom: 8px;
   }
   .documents-panel {
  margin-top: 16px;
}

.document-item {
  border-bottom: 1px solid #eee;
  margin-bottom: 8px;
}

.no-documents {
  text-align: center;
  color: #666;
  padding: 16px;
}

mat-list-item {
  height: auto !important;
  margin: 16px 0;
}

[matListItemMeta] {
  display: flex;
  gap: 8px;
}
.tasks-section {
  margin-top: 20px;
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}


 `]
})
export class ProjectDetailsDialogComponent implements OnInit {
  availableUsers: User[] = [];
  canEdit: boolean = true;
  reports: ProjectReport[] = [];
  documents: ProjectDocument[] = [];
  newReport: Partial<ProjectReport> = {
    title: '',
    content: '',
    reportType: 'Progress'
  };

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
  ) { }

  ngOnInit() {
    this.initializeDateTimeFields();

    this.loadReports();
    this.loadUsers();
    if (this.data.id) {
      this.loadDocuments();
    }
  }

  initializeDateTimeFields() {
    console.log('Initializing date-time fields with data:', this.data);

    if (this.data.startDate) {
      const startDateTime = new Date(this.data.startDate);

      this.startDate = new Date(
        startDateTime.getFullYear(),
        startDateTime.getMonth(),
        startDateTime.getDate()
      );

      this.startTime = this.formatTimeFromDate(startDateTime);

      console.log('Extracted startDate:', this.startDate);
      console.log('Extracted startTime:', this.startTime);
    }

    if (this.data.plannedEndDate) {
      const endDateTime = new Date(this.data.plannedEndDate);

      this.endDate = new Date(
        endDateTime.getFullYear(),
        endDateTime.getMonth(),
        endDateTime.getDate()
      );

      this.endTime = this.formatTimeFromDate(endDateTime);

      console.log('Extracted endDate:', this.endDate);
      console.log('Extracted endTime:', this.endTime);
    }
  }

  formatTimeFromDate(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  fixTimeZoneIssues() {
    if (this.data.startDate) {
      if (typeof this.data.startDate === 'string') {
        this.data.startDate = new Date(this.data.startDate);
      }
      const currentOffset = this.data.startDate.getTimezoneOffset();
      if (currentOffset !== 0) {
        console.log('Korrigálás startDate időzóna eltérés:', currentOffset);
        const correctedDate = new Date(this.data.startDate.getTime());
        this.data.startDate = correctedDate;
      }
    }

    if (this.data.plannedEndDate) {
      if (typeof this.data.plannedEndDate === 'string') {
        this.data.plannedEndDate = new Date(this.data.plannedEndDate);
      }
      const currentOffset = this.data.plannedEndDate.getTimezoneOffset();
      if (currentOffset !== 0) {
        console.log('Korrigálás plannedEndDate időzóna eltérés:', currentOffset);
        const correctedDate = new Date(this.data.plannedEndDate.getTime());
        this.data.plannedEndDate = correctedDate;
      }
    }
  }

  extractDateAndTime() {
    console.log('Extracting date and time from:', {
      startDate: this.data.startDate,
      endDate: this.data.plannedEndDate
    });

    if (this.data.startDate) {
      const startDateTime = new Date(this.data.startDate);
      this.startDate = new Date(
        startDateTime.getFullYear(),
        startDateTime.getMonth(),
        startDateTime.getDate()
      );
      this.startTime = `${startDateTime.getHours().toString().padStart(2, '0')}:${startDateTime.getMinutes().toString().padStart(2, '0')}`;
      console.log('Extracted start time:', this.startTime);
    }

    if (this.data.plannedEndDate) {
      const endDateTime = new Date(this.data.plannedEndDate);
      this.endDate = new Date(
        endDateTime.getFullYear(),
        endDateTime.getMonth(),
        endDateTime.getDate()
      );
      this.endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;
      console.log('Extracted end time:', this.endTime);
    }
  }

  formatTime(date: Date): string {
    return date.getHours().toString().padStart(2, '0') + ':' +
      date.getMinutes().toString().padStart(2, '0');
  }

  combineDateAndTime(date: Date, timeString: string): Date {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const [hours, minutes] = timeString.split(':').map(Number);

    dateOnly.setHours(hours, minutes, 0, 0);

    return dateOnly;
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => this.availableUsers = users,
      error: (error) => console.error('Error loading users:', error)
    });
  }

  loadDocuments() {
    const projectId = this.data.id;
    if (projectId === undefined) {
      return;
    }

    this.documentService.getProjectDocuments(projectId).subscribe({
      next: (docs: ProjectDocument[]) => this.documents = docs,
      error: (error: Error) => console.error('Error loading documents:', error)
    });
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
        this.newReport = { title: '', content: '', reportType: 'Progress' };
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  loadReports() {
    const projectId = this.data.id;
    if (projectId === undefined) {
      return;
    }

    this.reportService.getProjectReports(projectId).subscribe({
      next: (reports) => this.reports = reports,
      error: (error: Error) => console.error('Error loading reports:', error)
    });
  }

  removeUser(user: User | ProjectUser): void {
    if (this.data.assignedUsers) {
      const index = this.data.assignedUsers.findIndex(u => u.id === user.id);
      if (index >= 0) {
        this.data.assignedUsers.splice(index, 1);
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.data.id) {
      this.documentService.uploadDocument(this.data.id, file).subscribe({
        next: (doc) => {
          this.documents.push(doc);
          event.target.value = '';
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
    if (confirm('Are you sure you want to delete this document?')) {
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

  toggleStatus(): void {
    this.data.isActive = !this.data.isActive;
    this.dialogRef.close({ action: 'toggle', project: this.data });
  }

  saveChanges(): void {
    try {
      console.log('Before combining dates:');
      console.log('Start Date:', this.startDate);
      console.log('Start Time:', this.startTime);
      console.log('End Date:', this.endDate);
      console.log('End Time:', this.endTime);

      const combinedStartDateTime = this.createExactDateTime(this.startDate, this.startTime);
      const combinedEndDateTime = this.createExactDateTime(this.endDate, this.endTime);

      console.log('After combining dates:');
      console.log('Combined Start DateTime:', combinedStartDateTime);
      console.log('Combined End DateTime:', combinedEndDateTime);

      this.data.startDate = combinedStartDateTime;
      this.data.plannedEndDate = combinedEndDateTime;

      console.log('Saving changes with combined dates:', this.data);
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

    console.log(`Created exact datetime: ${result.toLocaleString()} from ${date.toDateString()} and ${timeString}`);
    return result;
  }

  close(): void {
    this.dialogRef.close();
  }
}
