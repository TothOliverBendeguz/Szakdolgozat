import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import * as vis from 'vis-network/standalone';
import { DataSet } from 'vis-data/standalone';
import { GraphService, GraphData, GraphNode, GraphEdge } from '../services/graph.service';
import { UserService, User } from '../services/user.service';
import { ProjectService, Project } from '../services/project.service';
import { ProjectDetailsDialogComponent } from '../projects/project-details-dialog/project-details-dialog.component';
import { ProjectClickMenuDialogComponent } from '../projects/project-click-menu-dialog.component';
import { AuthService } from '../auth.service';
import { UserProfileService, UserSettings } from '../services/user-profile.service';

@Component({
  selector: 'app-graph-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="graph-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Gráfos Nézet</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="controls-section">
            <div class="filter-controls">
              <mat-form-field>
                <mat-label>Nézet típusa</mat-label>
                <mat-select [(ngModel)]="viewType" (selectionChange)="onViewTypeChange()">
                  <mat-option value="all" *ngIf="authService.isAdmin()">Összes kapcsolat</mat-option>
                  <mat-option value="projects">Csak projektek</mat-option>
                  <mat-option value="project-tasks">Projekt és feladatai</mat-option>
                  <mat-option value="user">Felhasználó és kapcsolatai</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field *ngIf="viewType === 'project-tasks'">
                <mat-label>Válassz projektet</mat-label>
                <mat-select [(ngModel)]="selectedProjectId" (selectionChange)="onProjectSelect()">
                  <mat-option *ngFor="let project of userProjects" [value]="project.id">
                    {{project.name}}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field *ngIf="viewType === 'user' && authService.isAdmin()">
                <mat-label>Válassz felhasználót</mat-label>
                <mat-select [(ngModel)]="selectedUserId" (selectionChange)="onUserSelect()">
                  <mat-option *ngFor="let user of users" [value]="user.id">
                    {{user.userName}}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="zoom-controls">
              <button mat-icon-button (click)="zoomIn()" matTooltip="Nagyítás">
                <mat-icon>zoom_in</mat-icon>
              </button>
              <button mat-icon-button (click)="zoomOut()" matTooltip="Kicsinyítés">
                <mat-icon>zoom_out</mat-icon>
              </button>
              <button mat-icon-button (click)="zoomToFit()" matTooltip="Illesztés">
                <mat-icon>fit_screen</mat-icon>
              </button>
              <button mat-icon-button (click)="centerGraph()" matTooltip="Középre">
                <mat-icon>center_focus_strong</mat-icon>
              </button>
              <button mat-icon-button (click)="resetGraph()" matTooltip="Alaphelyzet">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </div>

          <div class="loading-container" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Gráf adatok betöltése...</p>
          </div>

          <div class="network-container" #networkContainer [style.display]="loading ? 'none' : 'block'"></div>

          <div class="legend">
            <h3>Jelmagyarázat</h3>
            <div class="legend-items">
              <div class="legend-item">
                <div class="legend-shape project-shape"></div>
                <span>Projekt</span>
              </div>
              <div class="legend-item">
                <div class="legend-shape task-shape"></div>
                <span>Feladat</span>
              </div>
              <div class="legend-item">
                <div class="legend-shape user-shape"></div>
                <span>Felhasználó</span>
              </div>
              <div class="legend-item">
                <div class="legend-shape deadline-shape"></div>
                <span>Közeli határidő</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .graph-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .controls-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .filter-controls {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .network-container {
      height: 600px;
      border: 1px solid #eee;
      border-radius: 4px;
      margin-bottom: 20px;
      background-color: #fafafa;
      overflow: hidden;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 600px;
      background-color: #fafafa;
      border: 1px solid #eee;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .loading-container p {
      margin-top: 16px;
      color: rgba(0, 0, 0, 0.54);
    }

    /* Jelmagyarázat */
    .legend {
      margin-top: 20px;
      padding: 16px;
      border: 1px solid #eee;
      border-radius: 4px;
      background-color: #fafafa;
    }

    .legend h3 {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-shape {
      width: 24px;
      height: 24px;
      border: 1px solid #333;
    }

    .project-shape {
      background-color: #4CAF50;
      border-radius: 4px;
    }

    .task-shape {
      background-color: #2196F3;
      border-radius: 50%;
    }

    .user-shape {
      background-color: #9C27B0;
      clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
    }

    .deadline-shape {
      background-color: white;
      border: 3px solid #ff0000;
      border-radius: 4px;
    }

    /* Reszponzív nézet */
    @media screen and (max-width: 768px) {
      .controls-section {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-controls {
        flex-direction: column;
        width: 100%;
      }

      .zoom-controls {
        justify-content: center;
        margin-top: 8px;
      }

      .network-container {
        height: 400px;
      }
    }
  `]
})
export class GraphViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  private containerElement: HTMLElement | null = null;

  private network: any = null;

  private nodes: any = null;
  private edges: any = null;

  viewType: 'all' | 'projects' | 'project-tasks' | 'user' = 'projects';
  selectedProjectId: number | null = null;
  selectedUserId: string | null = null;

  projects: Project[] = [];
  userProjects: Project[] = [];
  users: User[] = [];
  userSettings: UserSettings | null = null;

  loading = true;

  constructor(
    private graphService: GraphService,
    private projectService: ProjectService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private userProfileService: UserProfileService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserSettings();
    this.loadProjects();
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.containerElement = this.networkContainer.nativeElement;
      if (this.containerElement) {
        this.initNetwork();
        this.loadGraphData();
      } else {
        console.error('Network container not found');
        this.snackBar.open('Nem sikerült inicializálni a gráf nézetet. Próbáld meg frissíteni az oldalt.', 'OK');
      }
      this.cdr.detectChanges();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }

    // Save current view type to settings
    this.saveGraphViewPreference();
  }

  loadUserSettings(): void {
    this.userProfileService.getUserSettings().subscribe({
      next: (settings) => {
        this.userSettings = settings;

        // Apply default graph view from settings
        if (settings.defaultGraphView) {
          // Only apply if it's a valid view type and the user has permissions for it
          if ((settings.defaultGraphView !== 'all' || this.authService.isAdmin()) &&
            ['all', 'projects', 'project-tasks', 'user'].includes(settings.defaultGraphView)) {
            this.viewType = settings.defaultGraphView as 'all' | 'projects' | 'project-tasks' | 'user';
            console.log('Applied saved graph view:', this.viewType);
          }
        }

        // If the viewType is 'all' but the user is not admin, change to 'projects'
        if (this.viewType === 'all' && !this.authService.isAdmin()) {
          this.viewType = 'projects';
        }

        // If the viewType is 'user', set the user ID if not already set
        if (this.viewType === 'user' && !this.selectedUserId) {
          this.selectedUserId = this.authService.getCurrentUserId();
        }
      },
      error: (error) => {
        console.error('Error loading user settings:', error);
      }
    });
  }

  saveGraphViewPreference(): void {
    if (!this.userSettings) return;

    this.userSettings.defaultGraphView = this.viewType;

    this.userProfileService.updateUserSettings(this.userSettings).subscribe({
      next: () => {
        console.log('Saved graph view preference:', this.viewType);
      },
      error: (error) => {
        console.error('Error saving graph view preference:', error);
      }
    });
  }

  private initNetwork(): void {
    if (!this.containerElement) {
      console.error('Network container is not available');
      return;
    }

    try {
      this.nodes = new DataSet([]);
      this.edges = new DataSet([]);

      const networkOptions = {
        nodes: {
          font: {
            size: 14,
            color: '#333333'
          },
          borderWidth: 1,
          borderWidthSelected: 2,
          chosen: true
        },
        edges: {
          font: {
            size: 12,
            color: '#666666'
          },
          color: {
            color: '#999999',
            highlight: '#000000'
          },
          width: 1,
          selectionWidth: 2,
          smooth: {
            enabled: true,
            type: 'continuous',
            roundness: 0.5
          }
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 200,
            springConstant: 0.08,
            damping: 0.4,
            avoidOverlap: 0.8
          },
          stabilization: {
            enabled: true,
            iterations: 2000,
            updateInterval: 25,
            fit: true
          },
          timestep: 0.5,
          adaptiveTimestep: true,
          maxVelocity: 50,
          minVelocity: 0.1
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          navigationButtons: true,
          keyboard: true,
          zoomView: true
        },
        layout: {
          hierarchical: {
            enabled: false,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 150,
            treeSpacing: 200
          }
        },
        groups: {
          'project': {
            shape: 'box',
            borderWidth: 2,
            borderWidthSelected: 4,
            color: {
              background: '#4CAF50',
              border: '#333333',
              highlight: {
                background: '#81C784',
                border: '#2E7D32'
              }
            },
            font: {
              size: 16,
              color: '#FFFFFF',
              face: 'Roboto',
              bold: true
            },
            shadow: {
              enabled: true,
              color: 'rgba(0,0,0,0.2)',
              size: 5,
              x: 2,
              y: 2
            }
          },
          'task': {
            shape: 'ellipse',
            borderWidth: 2,
            borderWidthSelected: 4,
            color: {
              background: '#2196F3',
              border: '#333333',
              highlight: {
                background: '#64B5F6',
                border: '#1565C0'
              }
            },
            font: {
              size: 14,
              color: '#FFFFFF',
              face: 'Roboto'
            },
            shadow: {
              enabled: true,
              color: 'rgba(0,0,0,0.2)',
              size: 5,
              x: 2,
              y: 2
            }
          },
          'user': {
            shape: 'diamond',
            borderWidth: 2,
            borderWidthSelected: 4,
            color: {
              background: '#9C27B0',
              border: '#7B1FA2',
              highlight: {
                background: '#CE93D8',
                border: '#6A1B9A'
              }
            },
            font: {
              size: 14,
              color: '#FFFFFF',
              face: 'Roboto'
            },
            shadow: {
              enabled: true,
              color: 'rgba(0,0,0,0.2)',
              size: 5,
              x: 2,
              y: 2
            }
          }
        }
      };

      this.network = new vis.Network(this.containerElement, { nodes: this.nodes, edges: this.edges }, networkOptions);

      this.network.on('click', (params: any) => {
        if (params.nodes && params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          this.handleNodeClick(nodeId);
        }
      });

      console.log('Graph network initialized successfully');
    } catch (error) {
      console.error('Error initializing vis network:', error);
    }
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;

        // A felhasználó projektjeinek szűrése
        const currentUserId = this.authService.getCurrentUserId();
        this.userProjects = projects.filter(project =>
          project.userId === currentUserId ||
          project.assignedUsers?.some(user => user.id === currentUserId) ||
          this.authService.isAdmin()
        );

        // Ha a viewType 'project-tasks' és nincs kiválasztott projekt, de van elérhető projekt
        if (this.viewType === 'project-tasks' && !this.selectedProjectId && this.userProjects.length > 0) {
          this.selectedProjectId = this.userProjects[0].id || null;
        }
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.snackBar.open('Hiba történt a projektek betöltése közben', 'OK', { duration: 3000 });
      }
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;

        // Ha a viewType 'user' és nincs kiválasztott felhasználó
        if (this.viewType === 'user' && !this.selectedUserId) {
          // Ha admin, akkor az első felhasználót választjuk, egyébként a saját ID-t
          this.selectedUserId = this.authService.isAdmin() ?
            (users.length > 0 ? users[0].id : null) :
            this.authService.getCurrentUserId();
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.snackBar.open('Hiba történt a felhasználók betöltése közben', 'OK', { duration: 3000 });
      }
    });
  }

  loadGraphData(): void {
    this.loading = true;

    let dataObservable;

    if (this.viewType === 'all') {
      // Csak adminok láthatják az összes kapcsolatot
      if (!this.authService.isAdmin()) {
        this.viewType = 'projects';
        dataObservable = this.graphService.getProjectsGraph();
      } else {
        dataObservable = this.graphService.getGraphData();
      }
    } else if (this.viewType === 'projects') {
      dataObservable = this.graphService.getProjectsGraph();
    } else if (this.viewType === 'project-tasks' && this.selectedProjectId) {
      dataObservable = this.graphService.getProjectWithTasksGraph(this.selectedProjectId);
    } else if (this.viewType === 'user') {
      const userId = this.selectedUserId || this.authService.getCurrentUserId();
      if (userId) {
        dataObservable = this.graphService.getUserGraph(userId);
      } else {
        this.loading = false;
        this.snackBar.open('Nincs kiválasztva felhasználó', 'OK', { duration: 3000 });
        return;
      }
    } else {
      // Alapértelmezett eset
      dataObservable = this.graphService.getProjectsGraph();
    }

    dataObservable.subscribe({
      next: (data) => {
        console.log("Loaded graph data:", data);
        this.updateNetworkData(data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading graph data:', error);
        this.snackBar.open('Hiba történt a gráf adatok betöltése közben', 'OK', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private updateNetworkData(data: GraphData): void {
    if (!this.network) return;

    const visNodes = data.nodes.map((node: GraphNode) => ({
      id: node.id,
      label: node.label,
      group: node.group,
      shape: node.shape,
      borderWidth: node.borderWidth || 1,
      color: node.color || {
        background: '#ccc',
        border: '#333333'
      },
      data: node.data
    }));

    const visEdges = data.edges.map((edge: GraphEdge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.label || '',
      arrows: edge.arrows || 'to'
    }));

    this.nodes.clear();
    this.edges.clear();

    this.nodes.add(visNodes);
    this.edges.add(visEdges);

    this.network.fit({
      animation: {
        duration: 1000,
        easingFunction: 'easeOutQuint'
      }
    });
  }

  handleNodeClick(nodeId: string): void {
    const idParts = nodeId.split('-');
    const nodeType = idParts[0];
    const entityId = idParts.slice(1).join('-');

    if (nodeType === 'project') {
      const projectId = parseInt(entityId, 10);
      const project = this.projects.find(p => p.id === projectId);

      if (project) {
        const dialogRef = this.dialog.open(ProjectClickMenuDialogComponent, {
          width: '300px',
          data: { project: project }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            if (result.action === 'view') {
              this.dialog.open(ProjectDetailsDialogComponent, {
                width: '700px',
                data: project
              }).afterClosed().subscribe(detailsResult => {
                if (detailsResult && detailsResult.action === 'save') {
                  this.loadGraphData();
                }
              });
            } else if (result.action === 'filter') {
              this.viewType = 'project-tasks';
              this.selectedProjectId = projectId;
              this.loadGraphData();
              this.saveGraphViewPreference();
            }
          }
        });
      }
    } else if (nodeType === 'task') {
      const visNode = this.nodes.get(nodeId);
      if (visNode && visNode.data) {
        this.snackBar.open(`Feladat: ${visNode.data.title}`, 'OK', { duration: 3000 });
      }
    } else if (nodeType === 'user') {
      if (this.authService.isAdmin()) {
        this.viewType = 'user';
        this.selectedUserId = entityId;
        this.loadGraphData();
        this.saveGraphViewPreference();
      } else {
        // Nem admin felhasználók csak a saját adataikat nézhetik
        if (entityId === this.authService.getCurrentUserId()) {
          this.viewType = 'user';
          this.selectedUserId = entityId;
          this.loadGraphData();
          this.saveGraphViewPreference();
        }
      }
    }
  }

  onViewTypeChange(): void {
    // Ha 'all' és nem admin, változtassuk 'projects'-re
    if (this.viewType === 'all' && !this.authService.isAdmin()) {
      this.viewType = 'projects';
    }

    if (this.viewType !== 'project-tasks') {
      this.selectedProjectId = null;
    }

    if (this.viewType !== 'user') {
      this.selectedUserId = null;
    } else if (!this.authService.isAdmin()) {
      // Nem admin felhasználók csak a saját adataikat nézhetik
      this.selectedUserId = this.authService.getCurrentUserId();
    }

    this.loadGraphData();
    this.saveGraphViewPreference();
  }

  onProjectSelect(): void {
    this.loadGraphData();
  }

  onUserSelect(): void {
    this.loadGraphData();
  }

  zoomIn(): void {
    if (this.network) {
      const scale = this.network.getScale() * 1.2;
      this.network.moveTo({
        scale: scale
      });
    }
  }

  zoomOut(): void {
    if (this.network) {
      const scale = this.network.getScale() / 1.2;
      this.network.moveTo({
        scale: scale
      });
    }
  }

  zoomToFit(): void {
    if (this.network) {
      this.network.fit({
        animation: {
          duration: 1000,
          easingFunction: 'easeOutQuint'
        }
      });
    }
  }

  centerGraph(): void {
    if (this.network) {
      this.network.moveTo({
        position: { x: 0, y: 0 },
        animation: true
      });
    }
  }

  resetGraph(): void {
    // Alapértelmezett nézet a felhasználónak megfelelően
    this.viewType = this.authService.isAdmin() ? 'all' : 'projects';
    this.selectedProjectId = null;
    this.selectedUserId = this.authService.isAdmin() ? null : this.authService.getCurrentUserId();
    this.loadGraphData();
    this.saveGraphViewPreference();
  }
}
