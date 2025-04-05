using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SzakDolgozat.Api.Data;
using SzakDolgozat.Api.Models;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using SzakDolgozat.Api.DTOs;
using System.Text.Json;
using SzakDolgozat.Api.Services;

namespace SzakDolgozat.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<ProjectController> _logger;

        public ProjectController(
            ApplicationDbContext context,
            UserManager<User> userManager,
            ILogger<ProjectController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectResponseDto>>> GetProjects()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized();
                }

                var projects = await _context.Projects
                    .Where(p => !p.IsDeleted) 
                    .Include(p => p.User)
                    .Include(p => p.ProjectUsers)
                        .ThenInclude(pu => pu.User)
                    .AsNoTracking()
                    .ToListAsync();

                var projectDtos = projects.Select(p => new ProjectResponseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    ProjectManager = p.ProjectManager,
                    StartDate = p.StartDate,
                    PlannedEndDate = p.PlannedEndDate,
                    Description = p.Description,
                    Repository = p.Repository,
                    IsActive = p.IsActive,
                    UserId = p.UserId,
                    CreatedById = p.CreatedById,
                    AssignedUsers = p.ProjectUsers.Select(pu => new UserDto
                    {
                        Id = pu.User.Id,
                        UserName = pu.User.UserName,
                        Email = pu.User.Email
                    }).ToList()
                });

                if (user.Role == (int)UserRole.Developer)
                {
                    projectDtos = projectDtos.Where(p => p.UserId == userId || p.IsActive);
                }
                else if (user.Role == (int)UserRole.Reader)
                {
                    projectDtos = projectDtos.Where(p => p.IsActive);
                }

                return Ok(projectDtos.ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching projects: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("deleted")]
        public async Task<ActionResult<IEnumerable<ProjectResponseDto>>> GetDeletedProjects()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized();
                }

                if (user.Role != (int)UserRole.Admin)
                {
                    return Forbid();
                }

                var projects = await _context.Projects
                    .Where(p => p.IsDeleted) 
                    .Include(p => p.User)
                    .Include(p => p.ProjectUsers)
                        .ThenInclude(pu => pu.User)
                    .AsNoTracking()
                    .ToListAsync();

                var projectDtos = projects.Select(p => new ProjectResponseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    ProjectManager = p.ProjectManager,
                    StartDate = p.StartDate,
                    PlannedEndDate = p.PlannedEndDate,
                    Description = p.Description,
                    Repository = p.Repository,
                    IsActive = p.IsActive,
                    UserId = p.UserId,
                    CreatedById = p.CreatedById,
                    AssignedUsers = p.ProjectUsers.Select(pu => new UserDto
                    {
                        Id = pu.User.Id,
                        UserName = pu.User.UserName,
                        Email = pu.User.Email
                    }).ToList()
                });

                return Ok(projectDtos.ToList());
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching deleted projects: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<Project>> CreateProject(CreateProjectDto projectDto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation($"Creating project with userId: {userId}");
                _logger.LogInformation($"Project data: {JsonSerializer.Serialize(projectDto)}");

                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Unauthorized();
                }

                if (user.Role == (int)UserRole.Reader)
                {
                    return Forbid();
                }

                if (projectDto.UserId != userId || projectDto.CreatedById != userId)
                {
                    _logger.LogWarning($"Correcting project owner/creator IDs: UserId={projectDto.UserId}, CreatedById={projectDto.CreatedById}, CurrentUserId={userId}");
                    projectDto.UserId = userId;
                    projectDto.CreatedById = userId;
                }

                bool creatorExists = projectDto.ProjectUsers?.Any(pu => pu.UserId == userId) ?? false;
                if (!creatorExists && projectDto.ProjectUsers != null)
                {
                    _logger.LogWarning($"Adding creator user to project users list");
                    projectDto.ProjectUsers.Add(new ProjectUserDto { UserId = userId });
                }
                else if (projectDto.ProjectUsers == null)
                {
                    _logger.LogWarning($"Creating new project users list with creator");
                    projectDto.ProjectUsers = new List<ProjectUserDto> { new ProjectUserDto { UserId = userId } };
                }

                var project = new Project
                {
                    Name = projectDto.Name,
                    ProjectManager = projectDto.ProjectManager,
                    StartDate = projectDto.StartDate,
                    PlannedEndDate = projectDto.PlannedEndDate,
                    Description = projectDto.Description,
                    Repository = projectDto.Repository,
                    UserId = userId,
                    IsActive = true,
                    CreatedById = userId,
                    ProjectUsers = projectDto.ProjectUsers?.Select(pu => new ProjectUser
                    {
                        UserId = pu.UserId
                    }).ToList() ?? new List<ProjectUser>()
                };

                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Project created successfully with ID: {project.Id}");

                return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating project: {ex}");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, UpdateProjectDto projectDto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation($"Updating project {id} by user {userId}");
                _logger.LogInformation($"Project update data: {JsonSerializer.Serialize(projectDto)}");

                var user = await _userManager.FindByIdAsync(userId);
                var existingProject = await _context.Projects
                    .Include(p => p.ProjectUsers)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (existingProject == null)
                {
                    return NotFound();
                }

                if (user == null)
                {
                    return Unauthorized();
                }

                if (user.Role == (int)UserRole.Reader)
                {
                    return Forbid();
                }

                bool isAdmin = user.Role == (int)UserRole.Admin;
                bool isOwnerOrCreator = (existingProject.UserId == userId || existingProject.CreatedById == userId);

                if (!isAdmin && !isOwnerOrCreator)
                {
                    _logger.LogWarning($"User {userId} tried to update project {id} without permission");
                    return Forbid();
                }

                existingProject.Name = projectDto.Name;
                existingProject.Description = projectDto.Description;
                existingProject.ProjectManager = projectDto.ProjectManager;
                existingProject.StartDate = projectDto.StartDate;
                existingProject.PlannedEndDate = projectDto.PlannedEndDate;
                existingProject.Repository = projectDto.Repository;

                if (isAdmin || isOwnerOrCreator)
                {
                    existingProject.IsActive = projectDto.IsActive;
                    _logger.LogInformation($"Project {id} active status updated to {projectDto.IsActive} by user {userId}");
                }

                if (existingProject.ProjectUsers != null)
                {
                    _context.ProjectUsers.RemoveRange(existingProject.ProjectUsers);
                    await _context.SaveChangesAsync();
                }

                List<ProjectUser> newProjectUsers = new List<ProjectUser>();
                bool ownerIncluded = false;
                bool creatorIncluded = false;
                bool currentUserIncluded = false;

                if (projectDto.ProjectUsers != null)
                {
                    foreach (var userDto in projectDto.ProjectUsers)
                    {
                        var projectUser = new ProjectUser
                        {
                            ProjectId = id,
                            UserId = userDto.UserId
                        };

                        newProjectUsers.Add(projectUser);

                        if (existingProject.UserId == userDto.UserId)
                            ownerIncluded = true;

                        if (existingProject.CreatedById == userDto.UserId)
                            creatorIncluded = true;

                        if (userId == userDto.UserId)
                            currentUserIncluded = true;
                    }
                }

                if (existingProject.UserId != null && !ownerIncluded)
                {
                    newProjectUsers.Add(new ProjectUser
                    {
                        ProjectId = id,
                        UserId = existingProject.UserId
                    });
                    _logger.LogInformation($"Added owner {existingProject.UserId} back to project {id}");
                }

                if (existingProject.CreatedById != null && !creatorIncluded)
                {
                    newProjectUsers.Add(new ProjectUser
                    {
                        ProjectId = id,
                        UserId = existingProject.CreatedById
                    });
                    _logger.LogInformation($"Added creator {existingProject.CreatedById} back to project {id}");
                }

                if (isOwnerOrCreator && !currentUserIncluded && userId != null)
                {
                    newProjectUsers.Add(new ProjectUser
                    {
                        ProjectId = id,
                        UserId = userId
                    });
                    _logger.LogInformation($"Added current user {userId} back to project {id} as they are owner/creator");
                }

                existingProject.ProjectUsers = newProjectUsers;

                _context.Entry(existingProject).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating project: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var user = await _userManager.FindByIdAsync(userId);
                var project = await _context.Projects
                    .Include(p => p.User)
                    .Include(p => p.ProjectUsers)
                        .ThenInclude(pu => pu.User)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound();
                }

                if (user.Role == (int)UserRole.Reader && !project.IsActive)
                {
                    return Forbid();
                }

                if (user.Role == (int)UserRole.Developer &&
                    !project.IsActive && project.UserId != userId)
                {
                    return Forbid();
                }

                return project;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching project: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{id}/toggle-status")]
        public async Task<IActionResult> ToggleProjectStatus(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var user = await _userManager.FindByIdAsync(userId);
                var project = await _context.Projects.FindAsync(id);

                if (project == null)
                {
                    return NotFound();
                }

                if (user.Role != (int)UserRole.Admin)
                {
                    return Forbid();
                }

                project.IsActive = !project.IsActive;
                await _context.SaveChangesAsync();

                return Ok(project);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error toggling project status: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var user = await _userManager.FindByIdAsync(userId);
                var project = await _context.Projects.FindAsync(id);

                if (project == null)
                {
                    return NotFound();
                }

                bool canDelete = false;

                if (user.Role == (int)UserRole.Admin)
                {
                    canDelete = true;
                }
                else if (user.Role == (int)UserRole.Developer &&
                        (project.UserId == userId || project.CreatedById == userId))
                {
                    canDelete = true;
                }

                if (!canDelete)
                {
                    _logger.LogWarning($"User {userId} tried to delete project {id} without permission");
                    return Forbid();
                }

                project.IsDeleted = true;
                project.DeletedAt = DateTime.UtcNow;
                _context.Entry(project).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Project {id} soft deleted by user {userId}");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting project: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpDelete("purge/{id}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> PurgeProject(int id)
        {
            try
            {
                var project = await _context.Projects.FindAsync(id);

                if (project == null)
                {
                    return NotFound();
                }

                var notifications = await _context.Notifications
                    .Where(n => n.ProjectId == id)
                    .ToListAsync();

                if (notifications.Any())
                {
                    _logger.LogInformation($"Deleting {notifications.Count} notifications for project {id}");
                    _context.Notifications.RemoveRange(notifications);
                    await _context.SaveChangesAsync();
                }

                var projectTasks = await _context.ProjectTasks
                    .Where(pt => pt.ProjectId == id)
                    .ToListAsync();

                foreach (var task in projectTasks)
                {
                    var taskAssignments = await _context.TaskAssignments
                        .Where(ta => ta.TaskId == task.Id)
                        .ToListAsync();

                    if (taskAssignments.Any())
                    {
                        _logger.LogInformation($"Deleting {taskAssignments.Count} task assignments for task {task.Id}");
                        _context.TaskAssignments.RemoveRange(taskAssignments);
                    }
                }

                await _context.SaveChangesAsync();

                if (projectTasks.Any())
                {
                    _logger.LogInformation($"Deleting {projectTasks.Count} tasks for project {id}");
                    _context.ProjectTasks.RemoveRange(projectTasks);
                    await _context.SaveChangesAsync();
                }

                var projectDocuments = await _context.ProjectDocuments
                    .Where(pd => pd.ProjectId == id)
                    .ToListAsync();

                if (projectDocuments.Any())
                {
                    _logger.LogInformation($"Deleting {projectDocuments.Count} documents for project {id}");
                    _context.ProjectDocuments.RemoveRange(projectDocuments);
                    await _context.SaveChangesAsync();
                }

                var projectReports = await _context.ProjectReports
                    .Where(pr => pr.ProjectId == id)
                    .ToListAsync();

                if (projectReports.Any())
                {
                    _logger.LogInformation($"Deleting {projectReports.Count} reports for project {id}");
                    _context.ProjectReports.RemoveRange(projectReports);
                    await _context.SaveChangesAsync();
                }

                var projectUsers = await _context.ProjectUsers
                    .Where(pu => pu.ProjectId == id)
                    .ToListAsync();

                if (projectUsers.Any())
                {
                    _logger.LogInformation($"Deleting {projectUsers.Count} user associations for project {id}");
                    _context.ProjectUsers.RemoveRange(projectUsers);
                    await _context.SaveChangesAsync();
                }

                var projectRelations = await _context.ProjectRelations
                    .Where(pr => pr.SourceProjectId == id || pr.TargetProjectId == id)
                    .ToListAsync();

                if (projectRelations.Any())
                {
                    _logger.LogInformation($"Deleting {projectRelations.Count} project relations for project {id}");
                    _context.ProjectRelations.RemoveRange(projectRelations);
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation($"Finally deleting project {id}");
                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error purging project: {ex}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private bool ProjectExists(int id)
        {
            return _context.Projects.Any(e => e.Id == id);
        }
    }
}