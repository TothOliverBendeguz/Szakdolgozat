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

    this.saveGraphViewPreference();
  }

  loadUserSettings(): void {
    this.userProfileService.getUserSettings().subscribe({
      next: (settings) => {
        this.userSettings = settings;

        if (settings.defaultGraphView) {
          if ((settings.defaultGraphView !== 'all' || this.authService.isAdmin()) &&
            ['all', 'projects', 'project-tasks', 'user'].includes(settings.defaultGraphView)) {
            this.viewType = settings.defaultGraphView as 'all' | 'projects' | 'project-tasks' | 'user';
            console.log('Applied saved graph view:', this.viewType);
          }
        }

        if (this.viewType === 'all' && !this.authService.isAdmin()) {
          this.viewType = 'projects';
        }

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

      const networkOptions: any = {
        nodes: {
          font: {
            size: 16,
            color: '#333333',
            face: 'arial',
            background: 'rgba(255, 255, 255, 0.8)'
          },
          borderWidth: 2,
          borderWidthSelected: 3,
          margin: 15,  
          chosen: true,
          shape: 'box',
          scaling: {
            label: {
              enabled: true
            }
          }
        },
        edges: {
          font: {
            size: 14,
            color: '#555555',
            face: 'arial',
            strokeWidth: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            multi: true,
            alignment: 'middle'
          },
          color: {
            color: '#555555',
            highlight: '#000000'
          },
          width: 2,
          selectionWidth: 3,
          smooth: false,  
          length: 250  
        },
        physics: {
          enabled: false,  
          stabilization: {
            enabled: true,
            iterations: 200,  
            updateInterval: 25,
            fit: true
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          navigationButtons: true,
          keyboard: true,
          zoomView: true,
          dragView: true,
          dragNodes: true,
          multiselect: true
        },
        layout: {
          improvedLayout: true,
          randomSeed: 42  
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
              bold: true,
              background: '#4CAF50'
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
              face: 'Roboto',
              background: '#2196F3'
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
              face: 'Roboto',
              background: '#9C27B0'
            }
          }
        }
      };

      this.network = new vis.Network(
        this.containerElement,
        { nodes: this.nodes, edges: this.edges },
        networkOptions
      );

      this.network.on('click', (params: any) => {
        if (params.nodes && params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          this.handleNodeClick(nodeId);
        }
      });

      this.network.once('stabilizationIterationsDone', () => {
        if (this.network) {
          this.network.setOptions({ physics: { enabled: false } });
          console.log('Physics disabled after stabilization');
        }
      });

      console.log('Graph network initialized successfully');
    } catch (error) {
      console.error('Error initializing vis network:', error);
    }
  }

  private updateNetworkData(data: GraphData): void {
    if (!this.network) return;

    const translatedEdges = data.edges.map((edge: GraphEdge) => {
      const translations: { [key: string]: string } = {
        'belongs to': 'hozzátartozik',
        'assigned to': 'hozzárendelve',
        'owns': 'tulajdonosa',
        'owned by': 'tulajdonosa',
        'depends on': 'függ tőle',
        'is depended on by': 'függ rá',
        'parent of': 'szülője',
        'child of': 'gyereke',
        'related to': 'kapcsolódik'
      };

      const translatedLabel = edge.label && translations[edge.label.toLowerCase()]
        ? translations[edge.label.toLowerCase()]
        : edge.label;

      return {
        ...edge,
        label: translatedLabel
      };
    });

    const visNodes = data.nodes.map((node: GraphNode) => ({
      id: node.id,
      label: node.label,
      group: node.group,
      shape: node.shape || (node.group === 'project' ? 'box' : (node.group === 'task' ? 'ellipse' : 'diamond')),
      borderWidth: node.borderWidth || 2,
      color: node.color || {
        background: '#ccc',
        border: '#333333'
      },
      data: node.data,
      margin: 15,  
      font: {
        size: node.group === 'project' ? 16 : 14,
        color: '#FFFFFF',
        face: 'arial',
        bold: node.group === 'project',
        background: node.group === 'project' ? 'rgba(76, 175, 80, 0.7)' :
          (node.group === 'task' ? 'rgba(33, 150, 243, 0.7)' : 'rgba(156, 39, 176, 0.7)')
      },
      fixed: false  
    }));

    const visEdges = translatedEdges.map((edge: GraphEdge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.label || '',
      arrows: edge.arrows || 'to',
      color: edge.color || {
        color: '#555555',
        highlight: '#000000'
      },
      width: edge.width || 2,
      dashes: edge.dashes,
      smooth: false,  
      length: 250,
      font: {
        background: 'rgba(255, 255, 255, 0.9)'
      }
    }));

    this.nodes.clear();
    this.edges.clear();

    this.nodes.add(visNodes);
    this.edges.add(visEdges);

    if (this.viewType === 'project-tasks') {
      this.network.setOptions({
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 200,  
            levelSeparation: 250,  
            treeSpacing: 250,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true
          }
        },
        physics: {
          enabled: true,  
          hierarchicalRepulsion: {
            nodeDistance: 200,  
            avoidOverlap: 1  
          },
          stabilization: {
            enabled: true,
            iterations: 100,
            updateInterval: 25
          }
        },
        interaction: {
          dragNodes: true,  
          multiselect: true
        }
      });
    } else if (this.viewType === 'user') {
      this.network.setOptions({
        layout: {
          hierarchical: {
            enabled: false
          }
        },
        physics: {
          enabled: true,  
          solver: 'repulsion',  
          repulsion: {
            nodeDistance: 200,  
            centralGravity: 0.1,
            springLength: 200,
            springConstant: 0.05,
            damping: 0.09
          },
          stabilization: {
            enabled: true,
            iterations: 100,
            updateInterval: 25
          }
        },
        interaction: {
          dragNodes: true,
          multiselect: true
        }
      });
    } else {
      this.network.setOptions({
        layout: {
          hierarchical: {
            enabled: false
          },
          randomSeed: 42  
        },
        physics: {
          enabled: true,  
          solver: 'repulsion',
          repulsion: {
            nodeDistance: 200,
            centralGravity: 0.1,
            springLength: 200,
            springConstant: 0.05,
            damping: 0.09
          },
          stabilization: {
            enabled: true,
            iterations: 100,
            updateInterval: 25
          }
        }
      });
    }

    this.network.stabilize(50);

    setTimeout(() => {
      this.network.fit({
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad'
        }
      });

      setTimeout(() => {
        if (this.network) {
          this.network.setOptions({ physics: { enabled: false } });
        }
      }, 1000);
    }, 200);
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;

        const currentUserId = this.authService.getCurrentUserId();
        this.userProjects = projects.filter(project =>
          project.userId === currentUserId ||
          project.assignedUsers?.some(user => user.id === currentUserId) ||
          this.authService.isAdmin()
        );

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

        if (this.viewType === 'user' && !this.selectedUserId) {
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
      dataObservable = this.graphService.getProjectsGraph();
    }

    dataObservable.subscribe({
      next: (data) => {
        console.log("Loaded graph data:", data);

        const filteredEdges = this.removeDuplicateEdges(data.edges);
        data.edges = filteredEdges;

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

  private removeDuplicateEdges(edges: GraphEdge[]): GraphEdge[] {
    const edgeMap = new Map<string, GraphEdge[]>();

    edges.forEach(edge => {
      const key = `${edge.from}-${edge.to}`;
      const reverseKey = `${edge.to}-${edge.from}`;

      if (edgeMap.has(key)) {
        edgeMap.get(key)!.push(edge);
      } else if (edgeMap.has(reverseKey)) {
        const reverseEdges = edgeMap.get(reverseKey)!;

        const hasReverseRelation = reverseEdges.some(re =>
          this.isReverseRelation(re.label, edge.label));

        if (!hasReverseRelation) {
          if (!edgeMap.has(key)) {
            edgeMap.set(key, []);
          }
          edgeMap.get(key)!.push(edge);
        }
      } else {
        edgeMap.set(key, [edge]);
      }
    });

    return Array.from(edgeMap.values()).flat();
  }

  private isReverseRelation(label1?: string, label2?: string): boolean {
    if (!label1 || !label2) return false;

    const reversePairs = [
      ['Depends on', 'Is depended on by'],
      ['Parent of', 'Child of'],
      ['Related to', 'Related to'] 
    ];

    return reversePairs.some(pair =>
      (pair[0] === label1 && pair[1] === label2) ||
      (pair[0] === label2 && pair[1] === label1));
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
    if (this.viewType === 'all' && !this.authService.isAdmin()) {
      this.viewType = 'projects';
    }

    if (this.viewType !== 'project-tasks') {
      this.selectedProjectId = null;
    }

    if (this.viewType !== 'user') {
      this.selectedUserId = null;
    } else if (!this.authService.isAdmin()) {
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
    this.viewType = this.authService.isAdmin() ? 'all' : 'projects';
    this.selectedProjectId = null;
    this.selectedUserId = this.authService.isAdmin() ? null : this.authService.getCurrentUserId();
    this.loadGraphData();
    this.saveGraphViewPreference();
  }
}
