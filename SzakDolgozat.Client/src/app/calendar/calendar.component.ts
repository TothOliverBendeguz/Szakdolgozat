import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService, Project } from '../services/project.service';
import { TaskService, Task } from '../services/task.service';
import { UserService, User } from '../services/user.service';
import { AuthService } from '../auth.service';
import { ProjectDetailsDialogComponent } from '../projects/project-details-dialog/project-details-dialog.component';
import { TaskDetailsDialogComponent } from '../tasks/task-details-dialog.component';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import huLocale from '@fullcalendar/core/locales/hu';

interface CalendarEvent extends EventInput {
  title: string;
  start: Date | string;
  end?: Date | string;
  extendedProps?: {
    isActive?: boolean;
    description?: string;
    manager?: string;
    projectId?: number;
    taskId?: number;
    userId?: string;
    userEmail?: string;
    userName?: string;
    isActivityLog?: boolean;
    isDeleted?: boolean;
  };
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="calendar-container">
      <div class="calendar-layout">
        <!-- Szűrő panel -->
        <div class="filter-panel">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Szűrők</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <!-- Nézet választó - Csak 2 opció -->
              <mat-button-toggle-group
                [(ngModel)]="selectedView"
                (change)="onViewChange()"
                class="view-toggle">
                <mat-button-toggle value="all">Összes</mat-button-toggle>
                <mat-button-toggle value="my">Saját</mat-button-toggle>
              </mat-button-toggle-group>

              <!-- Megjelenítési típus választó -->
              <mat-form-field class="selector">
                <mat-label>Megjelenítés típusa</mat-label>
                <mat-select [(ngModel)]="selectedDisplayType" (selectionChange)="filterEvents()">
                  <mat-option value="all">Minden típus</mat-option>
                  <mat-option value="projects">Csak projektek</mat-option>
                  <mat-option value="tasks">Csak feladatok</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Projekt választó -->
              <mat-form-field class="selector">
                <mat-label>Projekt szűrő</mat-label>
                <mat-select [(ngModel)]="selectedProjectId" (selectionChange)="filterEvents()">
                  <mat-option [value]="null">Összes projekt</mat-option>
                  <mat-option *ngFor="let project of projects" [value]="project.id">
                    {{project.name}}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Felhasználó szűrő (csak adminoknak) -->
              <mat-form-field class="selector" *ngIf="authService.isAdmin()">
                <mat-label>Felhasználó szűrő</mat-label>
                <mat-select [(ngModel)]="selectedUserId" (selectionChange)="loadActivitiesForUser()">
                  <mat-option [value]="null">Összes felhasználó</mat-option>
                  <mat-option *ngFor="let user of users" [value]="user.id">
                    {{user.userName}} ({{user.email}})
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Naptár nézet választó -->
              <mat-form-field class="selector">
                <mat-label>Naptár nézet</mat-label>
                <mat-select [(ngModel)]="calendarViewType" (selectionChange)="updateCalendarView()">
                  <mat-option value="dayGridMonth">Hónap</mat-option>
                  <mat-option value="dayGridWeek">Hét</mat-option>
                </mat-select>
              </mat-form-field>
              
              <!-- Törölt elemek megjelenítése (csak admin) -->
              <mat-form-field class="selector" *ngIf="authService.isAdmin()">
                <mat-label>Törölt elemek</mat-label>
                <mat-select [(ngModel)]="showDeleted" (selectionChange)="reloadAllData()">
                  <mat-option [value]="false">Elrejtés</mat-option>
                  <mat-option [value]="true">Megjelenítés</mat-option>
                </mat-select>
              </mat-form-field>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Naptár -->
        <div class="calendar-main">
          <mat-card>
            <mat-card-content>
              <full-calendar #calendar [options]="calendarOptions"></full-calendar>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .calendar-container {
      padding: 20px;
    }
    .calendar-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
    }
    .filter-panel {
      position: sticky;
      top: 84px;
    }
    .selector {
      width: 100%;
      margin-top: 16px;
    }
    .view-toggle {
      width: 100%;
      margin-bottom: 16px;
    }
    ::ng-deep .fc-event {
      cursor: pointer;
      padding: 2px 5px;
    }
    ::ng-deep .fc-event.active-project {
      background-color: #4CAF50;
      border-color: #388E3C;
    }
    ::ng-deep .fc-event.inactive-project {
      background-color: #9E9E9E;
      border-color: #757575;
    }
    ::ng-deep .fc-event.task-event {
      background-color: #2196F3;
      border-color: #1976D2;
    }
    ::ng-deep .fc-event.activity-event {
      background-color: #9C27B0;
      border-color: #7B1FA2;
    }
    ::ng-deep .fc-event.deleted-event {
      text-decoration: line-through;
      opacity: 0.7;
    }
    ::ng-deep .fc-event-title {
      font-weight: normal;
    }
  `]
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek'
    },
    buttonText: {
      today: 'Ma',
      month: 'Hónap',
      week: 'Hét'
    },
    locale: 'hu',
    firstDay: 1,
    events: [],
    eventDisplay: 'block',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    dayHeaderFormat: { weekday: 'short', day: 'numeric' },
    titleFormat: { year: 'numeric', month: 'long' },
    eventContent: (arg) => {
      let titleText = arg.event.title;

      if (arg.event.extendedProps &&
        (arg.event.extendedProps['isActivityLog'] || arg.event.extendedProps['taskId'])) {
        const userName = arg.event.extendedProps['userName'] || '';
        titleText = `${titleText} / ${userName}`;
      }

      return {
        html: `<div class="event-content">${titleText}</div>`
      }
    },
    eventClassNames: (arg) => {
      const classNames = [];

      if (arg.event.extendedProps) {
        if (arg.event.extendedProps['isDeleted']) {
          classNames.push('deleted-event');
        }

        if (arg.event.extendedProps['isActivityLog']) {
          classNames.push('activity-event');
        } else if (arg.event.extendedProps['taskId']) {
          classNames.push('task-event');
        } else if (arg.event.extendedProps['isActive']) {
          classNames.push('active-project');
        } else {
          classNames.push('inactive-project');
        }
      }

      return classNames;
    },
    eventClick: (info) => {
      this.handleEventClick(info);
    },
    datesSet: (dateInfo) => {
      this.reloadAllData();
    }
  };

  projects: Project[] = [];
  filteredProjects: Project[] = [];
  tasks: Task[] = [];
  users: User[] = [];
  deletedProjects: Project[] = [];
  deletedTasks: Task[] = [];
  allEvents: CalendarEvent[] = [];
  projectEvents: CalendarEvent[] = [];
  taskEvents: CalendarEvent[] = [];

  selectedProjectId: number | null = null;
  selectedUserId: string | null = null;
  selectedView: 'all' | 'my' = 'all';
  selectedDisplayType: 'all' | 'projects' | 'tasks' = 'all';
  calendarViewType: string = 'dayGridMonth';
  showDeleted: boolean = false;

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private userService: UserService,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.reloadAllData();
  }

  reloadAllData() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        const currentUserId = this.authService.getCurrentUserId();

        this.projects = projects;
        this.filteredProjects = projects.filter(project =>
          project.userId === currentUserId ||
          project.assignedUsers?.some(user => user.id === currentUserId) ||
          this.authService.isAdmin()
        );

        if (this.showDeleted && this.authService.isAdmin()) {
          this.loadDeletedProjects();
        } else {
          this.createProjectEvents();
        }
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.snackBar.open('Hiba történt a projektek betöltése közben', 'OK', { duration: 3000 });
        this.createProjectEvents();
      }
    });
  }

  loadDeletedProjects() {
    if (this.authService.isAdmin()) {
      this.projectService.getDeletedProjects().pipe(
        catchError(error => {
          console.error('Error loading deleted projects:', error);
          return of([]);
        })
      ).subscribe(deletedProjects => {
        this.deletedProjects = deletedProjects;
        this.createProjectEvents();
      });
    } else {
      this.deletedProjects = [];
      this.createProjectEvents();
    }
  }

  loadUsers(): void {
    const currentUserId = this.authService.getCurrentUserId();

    if (this.authService.isAdmin()) {
      this.userService.getUsers().subscribe({
        next: (users: User[]) => {
          this.users = users;
        },
        error: (error: any) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Hiba történt a felhasználók betöltése közben', 'OK', { duration: 3000 });

          if (currentUserId) {
            this.users = [{
              id: currentUserId,
              userName: this.authService.getCurrentUserEmail() || 'Current User',
              email: this.authService.getCurrentUserEmail() || '',
              role: this.authService.getCurrentUserRole()
            }];
          } else {
            this.users = [];
          }
        }
      });
    } else {
      if (currentUserId) {
        this.users = [{
          id: currentUserId,
          userName: this.authService.getCurrentUserEmail() || 'Current User',
          email: this.authService.getCurrentUserEmail() || '',
          role: this.authService.getCurrentUserRole()
        }];
      } else {
        this.users = [];
      }
    }
  }

  loadTasks() {
    const projectIds = this.getFilteredProjectIds();

    if (projectIds.length === 0) {
      this.tasks = [];
      this.taskEvents = [];
      this.filterEvents();
      return;
    }

    const taskObservables: Observable<Task[]>[] = projectIds.map(id => this.taskService.getProjectTasks(id));

    forkJoin(taskObservables).subscribe({
      next: (results: Task[][]) => {
        this.tasks = results.flat();

        if (this.selectedView === 'my') {
          const currentUserId = this.authService.getCurrentUserId();
          this.tasks = this.tasks.filter(task =>
            task.assignedUsers?.some(user => user.id === currentUserId)
          );
        }

        if (this.showDeleted && this.authService.isAdmin()) {
          this.loadDeletedTasks(projectIds);
        } else {
          this.createTaskEvents();
        }
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
        this.snackBar.open('Hiba történt a feladatok betöltése közben', 'OK', { duration: 3000 });
        this.createTaskEvents();
      }
    });
  }

  loadDeletedTasks(projectIds: number[]) {
    if (this.authService.isAdmin() && projectIds.length > 0) {
      const deletedTaskObservables: Observable<Task[]>[] = projectIds.map(id =>
        this.taskService.getDeletedProjectTasks(id).pipe(
          catchError(error => {
            console.error(`Error loading deleted tasks for project ${id}:`, error);
            return of([]);
          })
        )
      );

      forkJoin(deletedTaskObservables).subscribe(results => {
        this.deletedTasks = results.flat();
        this.createTaskEvents();
      });
    } else {
      this.deletedTasks = [];
      this.createTaskEvents();
    }
  }

  createProjectEvents() {
    this.projectEvents = this.projects.map(project => ({
      title: project.name,
      start: project.startDate,
      end: project.plannedEndDate,
      extendedProps: {
        isActive: project.isActive,
        description: project.description,
        manager: project.projectManager,
        projectId: project.id,
        isDeleted: false
      }
    }));

    if (this.showDeleted && this.deletedProjects && this.deletedProjects.length > 0) {
      const deletedEvents = this.deletedProjects.map(project => ({
        title: `${project.name} (törölt)`,
        start: project.startDate,
        end: project.plannedEndDate,
        extendedProps: {
          isActive: false,
          description: project.description,
          manager: project.projectManager,
          projectId: project.id,
          isDeleted: true
        }
      }));

      this.projectEvents = [...this.projectEvents, ...deletedEvents];
    }

    this.loadTasks();
  }

  createTaskEvents() {
    this.taskEvents = this.tasks.map(task => {
      let userNames = '';
      let userId = '';
      let userEmail = '';

      if (task.assignedUsers && task.assignedUsers.length > 0) {
        userNames = task.assignedUsers.map(u => u.userName).join(', ');
        userId = task.assignedUsers[0].id;
        userEmail = task.assignedUsers[0].email;
      }

      return {
        title: `${task.title}`,
        start: task.startDate,
        end: task.dueDate,
        extendedProps: {
          taskId: task.id,
          projectId: task.projectId,
          userId: userId,
          userName: userNames,
          userEmail: userEmail,
          description: task.description,
          isDeleted: false
        }
      };
    });

    if (this.showDeleted && this.deletedTasks && this.deletedTasks.length > 0) {
      const deletedEvents = this.deletedTasks.map(task => {
        let userNames = '';
        let userId = '';
        let userEmail = '';

        if (task.assignedUsers && task.assignedUsers.length > 0) {
          userNames = task.assignedUsers.map(u => u.userName).join(', ');
          userId = task.assignedUsers[0].id;
          userEmail = task.assignedUsers[0].email;
        }

        return {
          title: `${task.title} (törölt)`,
          start: task.startDate,
          end: task.dueDate,
          extendedProps: {
            taskId: task.id,
            projectId: task.projectId,
            userId: userId,
            userName: userNames,
            userEmail: userEmail,
            description: task.description,
            isDeleted: true
          }
        };
      });

      this.taskEvents = [...this.taskEvents, ...deletedEvents];
    }

    this.filterEvents();
  }

  loadActivitiesForUser(): void {
    if (!this.selectedUserId) {
      this.filterEvents();
      return;
    }

    console.log(`Loading activities for user: ${this.selectedUserId}`);

    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects;

        this.filteredProjects = projects.filter(project => {
          const isOwner = project.userId === this.selectedUserId;
          const isAssigned = project.assignedUsers?.some(user => user.id === this.selectedUserId);
          return isOwner || isAssigned;
        });

        this.projectEvents = this.projects.map(project => ({
          title: project.name,
          start: project.startDate,
          end: project.plannedEndDate,
          extendedProps: {
            isActive: project.isActive,
            description: project.description,
            manager: project.projectManager,
            projectId: project.id,
            userId: project.userId,
            isDeleted: false
          }
        }));

        const projectIds = this.projects
          .filter(p => p.id !== undefined)
          .map(p => p.id!);

        if (projectIds.length > 0) {
          const taskObservables: Observable<Task[]>[] = projectIds.map(id =>
            this.taskService.getProjectTasks(id)
          );

          forkJoin(taskObservables).subscribe({
            next: (results: Task[][]) => {
              const allTasks = results.flat();

              this.tasks = allTasks.filter(task => {
                const isAssigned = task.assignedUsers?.some(user => user.id === this.selectedUserId);
                return isAssigned;
              });

              this.createTaskEvents();

              this.filterEvents();
            },
            error: (error) => {
              console.error('Error loading tasks for user:', error);
              this.snackBar.open('Hiba történt a feladatok betöltése közben', 'OK', { duration: 3000 });
              this.filterEvents();
            }
          });
        } else {
          this.tasks = [];
          this.taskEvents = [];
          this.filterEvents();
        }
      },
      error: (error) => {
        console.error('Error loading projects for user:', error);
        this.snackBar.open('Hiba történt a projektek betöltése közben', 'OK', { duration: 3000 });
        this.filterEvents();
      }
    });
  }

  onViewChange() {
    if (this.selectedView === 'my') {
      this.loadProjects();
    } else {
      this.loadProjects();
    }
  }

  filterEvents() {
    let filteredEvents: CalendarEvent[] = [];
    const currentUserId = this.authService.getCurrentUserId();

    if (this.selectedDisplayType === 'all' || this.selectedDisplayType === 'projects') {
      let projectEventsToShow = [...this.projectEvents];

      if (this.selectedView === 'my' && currentUserId) {
        const myProjectIds = this.projects
          .filter(p => p.userId === currentUserId ||
            p.assignedUsers?.some(u => u.id === currentUserId))
          .map(p => p.id);

        projectEventsToShow = projectEventsToShow.filter(event =>
          event.extendedProps &&
          myProjectIds.includes(event.extendedProps['projectId'])
        );
      }

      if (this.selectedUserId) {
        const userProjectIds = this.projects
          .filter(p => p.userId === this.selectedUserId ||
            p.assignedUsers?.some(u => u.id === this.selectedUserId))
          .map(p => p.id);

        projectEventsToShow = projectEventsToShow.filter(event =>
          event.extendedProps &&
          userProjectIds.includes(event.extendedProps['projectId'])
        );
      }

      if (this.selectedProjectId) {
        projectEventsToShow = projectEventsToShow.filter(event =>
          event.extendedProps && event.extendedProps['projectId'] === this.selectedProjectId
        );
      }

      if (!this.showDeleted) {
        projectEventsToShow = projectEventsToShow.filter(event =>
          !event.extendedProps || !event.extendedProps['isDeleted']
        );
      }

      filteredEvents = [...filteredEvents, ...projectEventsToShow];
    }

    if (this.selectedDisplayType === 'all' || this.selectedDisplayType === 'tasks') {
      let taskEventsToShow = [...this.taskEvents];

      if (this.selectedView === 'my' && currentUserId) {
        taskEventsToShow = taskEventsToShow.filter(event =>
          event.extendedProps &&
          event.extendedProps['userId'] === currentUserId
        );
      }

      if (this.selectedUserId) {
        taskEventsToShow = taskEventsToShow.filter(event => {
          const isAssignedToUser = this.tasks.some(task =>
            task.id === event.extendedProps?.['taskId'] &&
            task.assignedUsers?.some(user => user.id === this.selectedUserId)
          );
          return isAssignedToUser;
        });
      }

      if (this.selectedProjectId) {
        taskEventsToShow = taskEventsToShow.filter(event =>
          event.extendedProps && event.extendedProps['projectId'] === this.selectedProjectId
        );
      }

      if (!this.showDeleted) {
        taskEventsToShow = taskEventsToShow.filter(event =>
          !event.extendedProps || !event.extendedProps['isDeleted']
        );
      }

      filteredEvents = [...filteredEvents, ...taskEventsToShow];
    }

    const calendarApi = this.getCalendarApi();
    if (calendarApi) {
      calendarApi.removeAllEvents();
      calendarApi.addEventSource(filteredEvents);
    }
  }

  updateCalendarView() {
    const calendarApi = this.getCalendarApi();
    if (calendarApi) {
      calendarApi.changeView(this.calendarViewType);
      this.reloadAllData();
    }
  }

  getFilteredProjectIds(): number[] {
    let filteredProjects = [...this.projects];

    if (this.selectedView === 'my') {
      const currentUserId = this.authService.getCurrentUserId();
      filteredProjects = filteredProjects.filter(p =>
        p.userId === currentUserId ||
        p.assignedUsers?.some(u => u.id === currentUserId)
      );
    }

    if (this.selectedUserId) {
      filteredProjects = filteredProjects.filter(p =>
        p.userId === this.selectedUserId ||
        p.assignedUsers?.some(u => u.id === this.selectedUserId)
      );
    }

    if (this.selectedProjectId) {
      filteredProjects = filteredProjects.filter(p => p.id === this.selectedProjectId);
    }

    return filteredProjects
      .filter(p => p.id !== undefined)
      .map(p => p.id!);
  }

  getCalendarApi() {
    return this.calendarComponent?.getApi();
  }

  handleEventClick(info: EventClickArg) {
    if (info.event.extendedProps && info.event.extendedProps['isActivityLog']) {
      const title = info.event.title;
      const userName = info.event.extendedProps['userName'] || 'N/A';
      const startDate = new Date(info.event.start!).toLocaleString();
      const endDate = info.event.end ? new Date(info.event.end).toLocaleString() : 'N/A';
      const description = info.event.extendedProps['description'] || 'Nincs leírás';
      const isDeleted = info.event.extendedProps['isDeleted'];

      let message = `Felhasználó: ${userName}\nIdőtartam: ${startDate} - ${endDate}\nLeírás: ${description}`;
      if (isDeleted) {
        message += '\n\nEz a tevékenység egy törölt projektre vagy feladatra vonatkozik.';
      }

      this.snackBar.open(message, 'Bezárás', {
        duration: 5000,
        verticalPosition: 'top'
      });
      return;
    }

    if (info.event.extendedProps) {
      const hasProjectId = 'projectId' in info.event.extendedProps;
      const hasTaskId = 'taskId' in info.event.extendedProps;
      const isDeleted = info.event.extendedProps['isDeleted'];

      if (hasProjectId && !hasTaskId && !isDeleted) {
        const projectId = info.event.extendedProps['projectId'];
        const project = this.projects.find(p => p.id === projectId);

        if (project) {
          this.dialog.open(ProjectDetailsDialogComponent, {
            width: '700px',
            data: project
          });
        }
        return;
      }

      if (hasTaskId && !isDeleted) {
        const taskId = info.event.extendedProps['taskId'];
        const task = this.tasks.find(t => t.id === taskId);

        if (task) {
          this.dialog.open(TaskDetailsDialogComponent, {
            width: '700px',
            data: { task: task }
          });
        }
        return;
      }

      if (isDeleted) {
        let entityType = hasTaskId ? "feladat" : "projekt";
        this.snackBar.open(`Ez egy törölt ${entityType}. A részletek már nem elérhetők.`, 'Bezárás', {
          duration: 3000
        });
        return;
      }
    }
  }
}
