import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface UserActivityLog {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  projectId?: number;
  projectName: string;
  taskId?: number;
  taskName: string;
  startDate: Date | string;
  endDate: Date | string;
  description?: string;
  isProjectDeleted: boolean;
  isTaskDeleted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserActivityLogService {
  private apiUrl = 'https://localhost:7294/api/UserActivityLog';

  constructor(private http: HttpClient) { }

  getUserActivities(userId: string, startDate: Date, endDate: Date): Observable<UserActivityLog[]> {
    console.log(`Fetching activities for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    return this.http.get<UserActivityLog[]>(
      `${this.apiUrl}/user/${userId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    ).pipe(
      tap((activities: UserActivityLog[]) => console.log(`Received ${activities.length} activities from server`)),
      catchError((error: any) => {
        console.error('Error fetching user activities:', error);
        return of([]);
      })
    );
  }

  getAllActivities(startDate: Date, endDate: Date): Observable<UserActivityLog[]> {
    console.log(`Fetching all activities from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    return this.http.get<UserActivityLog[]>(
      `${this.apiUrl}/all?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    ).pipe(
      tap((activities: UserActivityLog[]) => console.log(`Received ${activities.length} activities from server`)),
      catchError((error: any) => {
        console.error('Error fetching all activities:', error);
        return of([]);
      })
    );
  }
}
