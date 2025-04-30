import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProjectDocument {
  id: number;
  projectId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: Date;
  createdById?: string;
  createdBy?: {
    userName: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProjectDocumentService {
  private apiUrl = 'https://localhost:7294/api/ProjectDocument';

  constructor(private http: HttpClient) { }

  getProjectDocuments(projectId: number): Observable<ProjectDocument[]> {
    return this.http.get<ProjectDocument[]>(`${this.apiUrl}/project/${projectId}`);
  }

  uploadDocument(projectId: number, file: File): Observable<ProjectDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProjectDocument>(`${this.apiUrl}/upload/${projectId}`, formData);
  }

  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${documentId}`, {
      responseType: 'blob'
    });
  }

  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentId}`);
  }
}
