import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ProjectService, Project } from './project.service';
import { TaskService, Task } from './task.service';
import { UserService, User } from './user.service';
import { ProjectRelationService, ProjectRelation } from './project-relation.service';
export interface GraphNode {
  id: string;
  label: string;
  group: 'project' | 'task' | 'user';
  borderWidth?: number;
  borderWidthSelected?: number;
  color?: {
    background?: string;
    border?: string;
    highlight?: any;
  };
  shape?: string;
  data?: any; 
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  arrows?: string;
  color?: {
    color?: string;
    highlight?: string;
    hover?: string;
  };
  width?: number;
  dashes?: number[];
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  private apiUrl = 'https://localhost:7294/api';

  constructor(
    private http: HttpClient,
    private projectService: ProjectService,
    private taskService: TaskService,
    private userService: UserService,
    private projectRelationService: ProjectRelationService 
  ) { }

  getGraphData(): Observable<GraphData> {
    return forkJoin({
      projects: this.projectService.getProjects(),
      users: this.userService.getUsers(),
      relations: this.projectRelationService.getAllRelations() 
    }).pipe(
      switchMap(({ projects, users, relations }) => {
        const graphData: GraphData = {
          nodes: [],
          edges: []
        };

        users.forEach(user => {
          graphData.nodes.push(this.createUserNode(user));
        });


        relations.forEach(relation => {
          const sourceProject = projects.find(p => p.id === relation.sourceProjectId);
          const targetProject = projects.find(p => p.id === relation.targetProjectId);

          if (sourceProject && targetProject) {
            const edgeId = `edge-project-relation-${relation.id}`;

            graphData.edges.push({
              id: edgeId,
              from: `project-${relation.sourceProjectId}`,
              to: `project-${relation.targetProjectId}`,
              label: relation.relationType,
              arrows: 'to',
              color: {
                color: '#009688',
                highlight: '#4DB6AC',
                hover: '#26A69A'
              },
              width: 2, 
              dashes: [5, 5]  
            });
          }
        });



        projects.forEach(project => {
          graphData.nodes.push(this.createProjectNode(project));
          this.addProjectUserEdges(graphData, project, users);
        });


        const projectIds = projects.filter(p => p.id !== undefined).map(p => p.id!);

        if (projectIds.length === 0) {
          return of(graphData);
        }

        const taskObservables = projectIds.map(projectId =>
          this.taskService.getProjectTasks(projectId).pipe(
            map(tasks => ({ projectId, tasks }))
          )
        );

        if (taskObservables.length === 0) {
          return of(graphData);
        }

        return forkJoin(taskObservables).pipe(
          map(projectTasksList => {
            projectTasksList.forEach(({ projectId, tasks }) => {
              tasks.forEach(task => {
                graphData.nodes.push(this.createTaskNode(task));

                graphData.edges.push({
                  id: `edge-task-${task.id}-project-${projectId}`,
                  from: `task-${task.id}`,
                  to: `project-${projectId}`,
                  label: 'belongs to',
                  arrows: 'to'
                });

                if (task.assignedUsers && task.assignedUsers.length > 0) {
                  task.assignedUsers.forEach(user => {
                    graphData.edges.push({
                      id: `edge-user-${user.id}-task-${task.id}`,
                      from: `user-${user.id}`,
                      to: `task-${task.id}`,
                      label: 'assigned to',
                      arrows: 'to'
                    });
                  });
                }
              });
            });

            return graphData;
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching graph data:', error);
        return of({ nodes: [], edges: [] });
      })
    );
  }




  getProjectsGraph(): Observable<GraphData> {
    return forkJoin({
      projects: this.projectService.getProjects(),
      relations: this.projectRelationService.getAllRelations()
    }).pipe(
      map(({ projects, relations }) => {
        const graphData: GraphData = {
          nodes: [],
          edges: []
        };

        projects.forEach(project => {
          graphData.nodes.push(this.createProjectNode(project));
        });

        relations.forEach(relation => {
          const sourceProject = projects.find(p => p.id === relation.sourceProjectId);
          const targetProject = projects.find(p => p.id === relation.targetProjectId);

          if (sourceProject && targetProject) {
            const edgeId = `edge-project-relation-${relation.id}`;

            graphData.edges.push({
              id: edgeId,
              from: `project-${relation.sourceProjectId}`,
              to: `project-${relation.targetProjectId}`,
              label: relation.relationType,
              arrows: 'to',
              color: {
                color: '#009688',
                highlight: '#4DB6AC',
                hover: '#26A69A'
              },
              width: 2,
              dashes: [5, 5]
            });
          }
        });

        return graphData;
      }),
      catchError(error => {
        console.error('Error fetching projects graph data:', error);
        return of({ nodes: [], edges: [] });
      })
    );
  }

  getProjectWithTasksGraph(projectId: number): Observable<GraphData> {
    return forkJoin({
      project: this.projectService.getProjects().pipe(
        map(projects => projects.find(p => p.id === projectId))
      ),
      tasks: this.taskService.getProjectTasks(projectId)
    }).pipe(
      map(({ project, tasks }) => {
        const graphData: GraphData = {
          nodes: [],
          edges: []
        };

        if (!project) {
          return graphData;
        }

        graphData.nodes.push(this.createProjectNode(project));

        tasks.forEach(task => {
          graphData.nodes.push(this.createTaskNode(task));

          graphData.edges.push({
            id: `edge-task-${task.id}-project-${project.id}`,
            from: `task-${task.id}`,
            to: `project-${project.id}`,
            label: 'belongs to',
            arrows: 'to'
          });

          if (task.assignedUsers && task.assignedUsers.length > 0) {
            task.assignedUsers.forEach(user => {
              const userNodeExists = graphData.nodes.some(node => node.id === `user-${user.id}`);
              if (!userNodeExists) {
                graphData.nodes.push(this.createUserNode(user));
              }

              graphData.edges.push({
                id: `edge-user-${user.id}-task-${task.id}`,
                from: `user-${user.id}`,
                to: `task-${task.id}`,
                label: 'assigned to',
                arrows: 'to'
              });
            });
          }
        });

        return graphData;
      }),
      catchError(error => {
        console.error(`Error fetching project ${projectId} graph data:`, error);
        return of({ nodes: [], edges: [] });
      })
    );
  }

  getUserGraph(userId: string): Observable<GraphData> {
    return forkJoin({
      user: this.userService.getUsers().pipe(
        map(users => users.find(u => u.id === userId))
      ),
      projects: this.projectService.getProjects()
    }).pipe(
      switchMap(({ user, projects }) => {
        const graphData: GraphData = {
          nodes: [],
          edges: []
        };

        if (!user) {
          return of(graphData);
        }

        graphData.nodes.push(this.createUserNode(user));

        const userProjects = projects.filter(p =>
          p.userId === userId ||
          p.assignedUsers?.some(u => u.id === userId)
        );

        userProjects.forEach(project => {
          graphData.nodes.push(this.createProjectNode(project));

          graphData.edges.push({
            id: `edge-user-${user.id}-project-${project.id}`,
            from: `user-${user.id}`,
            to: `project-${project.id}`,
            label: project.userId === userId ? 'owns' : 'assigned to',
            arrows: 'to'
          });
        });

        const projectIds = userProjects.filter(p => p.id !== undefined).map(p => p.id!);

        if (projectIds.length === 0) {
          return of(graphData);
        }

        const taskObservables = projectIds.map(projectId =>
          this.taskService.getProjectTasks(projectId).pipe(
            map(tasks => ({ projectId, tasks: tasks.filter(t => t.assignedUsers?.some(u => u.id === userId)) }))
          )
        );

        if (taskObservables.length === 0) {
          return of(graphData);
        }

        return forkJoin(taskObservables).pipe(
          map(projectTasksList => {
            projectTasksList.forEach(({ projectId, tasks }) => {
              tasks.forEach(task => {
                graphData.nodes.push(this.createTaskNode(task));

                // Feladat -> projekt kapcsolat
                graphData.edges.push({
                  id: `edge-task-${task.id}-project-${projectId}`,
                  from: `task-${task.id}`,
                  to: `project-${projectId}`,
                  label: 'belongs to',
                  arrows: 'to'
                });

                // Felhasználó -> feladat kapcsolat
                graphData.edges.push({
                  id: `edge-user-${user.id}-task-${task.id}`,
                  from: `user-${user.id}`,
                  to: `task-${task.id}`,
                  label: 'assigned to',
                  arrows: 'to'
                });
              });
            });

            return graphData;
          })
        );
      }),
      catchError(error => {
        console.error(`Error fetching user ${userId} graph data:`, error);
        return of({ nodes: [], edges: [] });
      })
    );
  }

  private createProjectNode(project: Project): GraphNode {
    const now = new Date();
    const plannedEndDate = new Date(project.plannedEndDate);
    const isNearDeadline = plannedEndDate > now &&
      (plannedEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7;

    return {
      id: `project-${project.id}`,
      label: project.name,
      group: 'project',
      shape: 'box',
      borderWidth: isNearDeadline ? 3 : 1,
      color: {
        background: project.isActive ? '#4CAF50' : '#9E9E9E',
        border: isNearDeadline ? '#ff0000' : '#333333'
      },
      data: project
    };
  }

  private createTaskNode(task: Task): GraphNode {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const isNearDeadline = dueDate > now &&
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7;

    let backgroundColor = '#9E9E9E'; // Default
    if (task.status === 'New') backgroundColor = '#2196F3';
    else if (task.status === 'InProgress') backgroundColor = '#FFC107';
    else if (task.status === 'Completed') backgroundColor = '#4CAF50';
    else if (task.status === 'OnHold') backgroundColor = '#F44336';

    return {
      id: `task-${task.id}`,
      label: task.title,
      group: 'task',
      shape: 'ellipse',
      borderWidth: isNearDeadline ? 3 : 1,
      color: {
        background: backgroundColor,
        border: isNearDeadline ? '#ff0000' : '#333333'
      },
      data: task
    };
  }

  private createUserNode(user: User): GraphNode {
    return {
      id: `user-${user.id}`,
      label: user.userName,
      group: 'user',
      shape: 'diamond',
      color: {
        background: '#9C27B0',
        border: '#7B1FA2'
      },
      data: user
    };
  }

  private addProjectUserEdges(graphData: GraphData, project: Project, users: User[]) {
    if (project.userId) {
      const ownerUser = users.find(u => u.id === project.userId);
      if (ownerUser) {
        graphData.edges.push({
          id: `edge-project-${project.id}-user-${project.userId}`,
          from: `project-${project.id}`,
          to: `user-${project.userId}`,
          label: 'owned by',
          arrows: 'to'
        });
      }
    }

    if (project.assignedUsers && project.assignedUsers.length > 0) {
      project.assignedUsers.forEach(assignedUser => {
        if (assignedUser.id !== project.userId) { 
          graphData.edges.push({
            id: `edge-project-${project.id}-user-${assignedUser.id}`,
            from: `project-${project.id}`,
            to: `user-${assignedUser.id}`,
            label: 'assigned to',
            arrows: 'to'
          });
        }
      });
    }
  }
}
