import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectRelation {
  id?: number;
  sourceProjectId: number;
  targetProjectId: number;
  relationType: string;
  description?: string;
  sourceProjectName?: string;
  targetProjectName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectRelationService {
  private apiUrl = 'https://localhost:7294/api/projectrelation';

  constructor(private http: HttpClient) { }

  getProjectRelations(projectId: number): Observable<ProjectRelation[]> {
    return this.http.get<ProjectRelation[]>(`${this.apiUrl}/project/${projectId}`);
  }

  getAllRelations(): Observable<ProjectRelation[]> {
    return this.http.get<ProjectRelation[]>(this.apiUrl);
  }

  getRelation(id: number): Observable<ProjectRelation> {
    return this.http.get<ProjectRelation>(`${this.apiUrl}/${id}`);
  }

  createRelation(relation: ProjectRelation): Observable<ProjectRelation> {
    return this.http.post<ProjectRelation>(this.apiUrl, relation);
  }

  updateRelation(relation: ProjectRelation): Observable<any> {
    return this.http.put(`${this.apiUrl}/${relation.id}`, relation);
  }

  deleteRelation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
