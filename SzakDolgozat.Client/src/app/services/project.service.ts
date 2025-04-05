import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { User } from './user.service';  

export interface ProjectUser {
  id: string;
  userName: string;
  email: string;
}

export interface ProjectUserWithDetails {
  userId: string;
  user: {
    userName: string;
    email: string;
  };
}

export interface Project {
  id?: number;
  name: string;
  projectManager: string;
  startDate: Date | string;
  plannedEndDate: Date | string;
  description?: string;
  isActive: boolean;
  userId?: string;
  repository?: string;
  createdById: string;
  assignedUsers?: User[];
  projectUsers?: ProjectUserWithDetails[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'https://localhost:7294/api/project';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl).pipe(
      tap(projects => {
        console.log('Retrieved projects:', projects);
        projects.forEach(project => {
          if (project.startDate) {
            const startDateTime = new Date(project.startDate);
            startDateTime.setHours(startDateTime.getHours()  );
            project.startDate = startDateTime;
            console.log(`Project ${project.id} startDate corrected: ${startDateTime.toLocaleString()}`);
          }

          if (project.plannedEndDate) {
            const endDateTime = new Date(project.plannedEndDate);
            endDateTime.setHours(endDateTime.getHours() );
            project.plannedEndDate = endDateTime;
            console.log(`Project ${project.id} plannedEndDate corrected: ${endDateTime.toLocaleString()}`);
          }

          if (project.projectUsers && project.projectUsers.length > 0) {
            project.assignedUsers = project.projectUsers.map(pu => ({
              id: pu.userId,
              userName: pu.user.userName,
              email: pu.user.email,
              role: 2 
            } as User));
          }
        });
      }),
      catchError(this.handleError)
    );
  }

  createProject(projectData: Partial<Project>): Observable<Project> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('No user ID found'));
    }

    let correctedStartDate = projectData.startDate;
    let correctedEndDate = projectData.plannedEndDate;

    if (projectData.startDate instanceof Date) {
      const startDate = new Date(projectData.startDate);
      startDate.setHours(startDate.getHours() + 1);
      correctedStartDate = startDate;
    }

    if (projectData.plannedEndDate instanceof Date) {
      const endDate = new Date(projectData.plannedEndDate);
      endDate.setHours(endDate.getHours() + 1);
      correctedEndDate = endDate;
    }

    let projectUsers = [];

    if (projectData.assignedUsers && projectData.assignedUsers.length > 0) {
      const containsCreator = projectData.assignedUsers.some(user =>
        (typeof user === 'string') ? user === userId : user.id === userId
      );

      projectUsers = projectData.assignedUsers.map(user => ({
        userId: typeof user === 'string' ? user : user.id
      }));

      if (!containsCreator) {
        projectUsers.push({ userId: userId });
      }
    } else {
      projectUsers = [{ userId: userId }];
    }

    const projectToSend = {
      name: projectData.name,
      projectManager: projectData.projectManager,
      startDate: correctedStartDate instanceof Date ? correctedStartDate.toISOString() : new Date(correctedStartDate!).toISOString(),
      plannedEndDate: correctedEndDate instanceof Date ? correctedEndDate.toISOString() : new Date(correctedEndDate!).toISOString(),
      description: projectData.description,
      repository: projectData.repository,
      userId: userId,           
      createdById: userId,      
      projectUsers: projectUsers 
    };

    console.log('Project data to send (with time correction):', {
      startDate: projectToSend.startDate,
      plannedEndDate: projectToSend.plannedEndDate,
      projectUsers: projectToSend.projectUsers
    });

    return this.http.post<Project>(this.apiUrl, projectToSend).pipe(
      tap(response => console.log('Project created successfully:', response)),
      catchError(error => {
        console.error('Error response:', error);
        const message = error.error?.message || error.error?.errors?.UserId || 'Error creating project';
        return throwError(() => new Error(message));
      })
    );
  }

  updateProject(project: Project): Observable<any> {
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) {
        return throwError(() => new Error('No user ID found'));
      }

      let correctedStartDate = project.startDate;
      let correctedEndDate = project.plannedEndDate;

      if (project.startDate instanceof Date) {
        const startDateTime = new Date(project.startDate);
        startDateTime.setHours(startDateTime.getHours() + 1);
        correctedStartDate = startDateTime;
      }

      if (project.plannedEndDate instanceof Date) {
        const endDateTime = new Date(project.plannedEndDate);
        endDateTime.setHours(endDateTime.getHours() + 1);
        correctedEndDate = endDateTime;
      }

      if (!project.assignedUsers) {
        project.assignedUsers = [];
      }

      if (userId && !project.assignedUsers.some(user => user.id === userId)) {
        console.log(`Adding current user ${userId} to assignedUsers list`);
        project.assignedUsers.push({
          id: userId,
          userName: this.authService.getCurrentUserEmail() || 'Current User',
          email: this.authService.getCurrentUserEmail() || '',
          role: this.authService.getCurrentUserRole()
        });
      }

      const projectUsers = project.assignedUsers.map(user => ({
        userId: typeof user === 'string' ? user : user.id
      }));

      const projectToSend = {
        name: project.name,
        projectManager: project.projectManager,
        startDate: correctedStartDate instanceof Date ? correctedStartDate.toISOString() : correctedStartDate,
        plannedEndDate: correctedEndDate instanceof Date ? correctedEndDate.toISOString() : correctedEndDate,
        description: project.description,
        repository: project.repository,
        isActive: project.isActive, 
        projectUsers: projectUsers
      };

      console.log('Sending to server with time-corrected dates:', {
        startDate: projectToSend.startDate,
        plannedEndDate: projectToSend.plannedEndDate,
        isActive: projectToSend.isActive,
        projectUsers: projectToSend.projectUsers
      });

      return this.http.put(`${this.apiUrl}/${project.id}`, projectToSend).pipe(
        tap(response => console.log('Project updated successfully:', response)),
        catchError(error => {
          console.error('Error updating project:', error);
          const message = error.error?.message || 'Error updating project';
          return throwError(() => new Error(message));
        })
      );
    } catch (error) {
      console.error('Exception in updateProject:', error);
      return throwError(() => error);
    }
  }
  toggleProjectStatus(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/toggle-status`, {}).pipe(
      catchError(this.handleError)
    );
  }

  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getDeletedProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/deleted`).pipe(
      tap(projects => {
        console.log('Retrieved deleted projects:', projects);
        projects.forEach(project => {
          if (project.startDate) {
            const startDateTime = new Date(project.startDate);
            startDateTime.setHours(startDateTime.getHours());
            project.startDate = startDateTime;
          }
          if (project.plannedEndDate) {
            const endDateTime = new Date(project.plannedEndDate);
            endDateTime.setHours(endDateTime.getHours());
            project.plannedEndDate = endDateTime;
          }
          if (project.projectUsers && project.projectUsers.length > 0) {
            project.assignedUsers = project.projectUsers.map(pu => ({
              id: pu.userId,
              userName: pu.user.userName,
              email: pu.user.email,
              role: 2
            } as User));
          }
        });
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }
}

