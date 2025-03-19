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
  templateUrl: './graph-view.component.html',
  styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('networkContainer') networkContainer!: ElementRef;

  private containerElement: HTMLElement | null = null;

  private network: any = null;

  private nodes: any = null;
  private edges: any = null;

  viewType: 'all' | 'projects' | 'project-tasks' | 'user' = 'all';
  selectedProjectId: number | null = null;
  selectedUserId: string | null = null;

  projects: Project[] = [];
  users: User[] = [];

  loading = true;

  constructor(
    private graphService: GraphService,
    private projectService: ProjectService,
    private userService: UserService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadProjects();
    this.loadUsers();
  }

  ngAfterViewInit(): void {

    setTimeout(() => {

      this.containerElement = document.querySelector('.network-container');
      if (this.containerElement) {
        this.initNetwork();
        this.loadGraphData();
      } else {
        console.error('Network container not found in the DOM');

        if (this.networkContainer && this.networkContainer.nativeElement) {
          this.containerElement = this.networkContainer.nativeElement;
          this.initNetwork();
          this.loadGraphData();
        } else {
          this.snackBar.open('Nem sikerült inicializálni a gráf nézetet. Próbáld meg frissíteni az oldalt.', 'OK');
        }
      }
      this.cdr.detectChanges();
    }, 500);
  }
  ngOnDestroy(): void {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
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
        roups: {
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
      dataObservable = this.graphService.getGraphData();
    } else if (this.viewType === 'projects') {
      dataObservable = this.graphService.getProjectsGraph();
    } else if (this.viewType === 'project-tasks' && this.selectedProjectId) {
      dataObservable = this.graphService.getProjectWithTasksGraph(this.selectedProjectId);
    } else if (this.viewType === 'user' && this.selectedUserId) {
      dataObservable = this.graphService.getUserGraph(this.selectedUserId);
    } else {
      dataObservable = this.graphService.getGraphData();
    }

    dataObservable.subscribe({
      next: (data) => {
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

    console.log('Received graph data:', data); 

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

    console.log('Processed nodes:', visNodes);
    console.log('Processed edges:', visEdges);

    this.nodes.clear();
    this.edges.clear();

    this.nodes.add(visNodes);
    this.edges.add(visEdges);

    console.log('Network data updated with', this.nodes.length, 'nodes and', this.edges.length, 'edges');

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
      this.viewType = 'user';
      this.selectedUserId = entityId;
      this.loadGraphData();
    }
  }

  onViewTypeChange(): void {
    if (this.viewType !== 'project-tasks') {
      this.selectedProjectId = null;
    }
    if (this.viewType !== 'user') {
      this.selectedUserId = null;
    }
    this.loadGraphData();
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
    this.viewType = 'all';
    this.selectedProjectId = null;
    this.selectedUserId = null;
    this.loadGraphData();
  }
}
