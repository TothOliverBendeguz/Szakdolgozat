using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SzakDolgozat.Api.Data;
using SzakDolgozat.Api.DTOs;
using SzakDolgozat.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using SzakDolgozat.Api.Services;

namespace SzakDolgozat.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TaskController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TaskController> _logger;

        public TaskController(
            ApplicationDbContext context,
            ILogger<TaskController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetProjectTasks(int projectId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var tasks = await _context.ProjectTasks
                    .Where(t => t.ProjectId == projectId && !t.IsDeleted) 
                    .Include(t => t.TaskAssignments)
                        .ThenInclude(ta => ta.User)
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();

                var taskDtos = tasks.Select(t => new TaskResponseDto
                {
                    Id = t.Id,
                    ProjectId = t.ProjectId,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,
                    StartDate = t.StartDate,
                    DueDate = t.DueDate,
                    CompletedDate = t.CompletedDate,
                    CreatedById = t.CreatedById,
                    CreatedAt = t.CreatedAt,
                    AssignedUsers = t.TaskAssignments.Select(ta => new UserDto
                    {
                        Id = ta.User.Id,
                        UserName = ta.User.UserName,
                        Email = ta.User.Email
                    }).ToList()
                });

                return Ok(taskDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project tasks");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("project/{projectId}/deleted")]
        public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetDeletedProjectTasks(int projectId)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                if (userRole != "1")
                {
                    return Forbid();
                }

                var tasks = await _context.ProjectTasks
                    .Where(t => t.ProjectId == projectId && t.IsDeleted) 
                    .Include(t => t.TaskAssignments)
                        .ThenInclude(ta => ta.User)
                    .OrderByDescending(t => t.CreatedAt)
                    .ToListAsync();

                var taskDtos = tasks.Select(t => new TaskResponseDto
                {
                    Id = t.Id,
                    ProjectId = t.ProjectId,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,
                    StartDate = t.StartDate,
                    DueDate = t.DueDate,
                    CompletedDate = t.CompletedDate,
                    CreatedById = t.CreatedById,
                    CreatedAt = t.CreatedAt,
                    AssignedUsers = t.TaskAssignments.Select(ta => new UserDto
                    {
                        Id = ta.User.Id,
                        UserName = ta.User.UserName,
                        Email = ta.User.Email
                    }).ToList()
                });

                return Ok(taskDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting deleted project tasks");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskResponseDto>> GetTask(int id)
        {
            try
            {
                var task = await _context.ProjectTasks
                    .Include(t => t.TaskAssignments)
                        .ThenInclude(ta => ta.User)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                {
                    return NotFound();
                }

                var taskDto = new TaskResponseDto
                {
                    Id = task.Id,
                    ProjectId = task.ProjectId,
                    Title = task.Title,
                    Description = task.Description,
                    Status = task.Status,
                    Priority = task.Priority,
                    StartDate = task.StartDate,
                    DueDate = task.DueDate,
                    CompletedDate = task.CompletedDate,
                    CreatedById = task.CreatedById,
                    CreatedAt = task.CreatedAt,
                    AssignedUsers = task.TaskAssignments.Select(ta => new UserDto
                    {
                        Id = ta.User.Id,
                        UserName = ta.User.UserName,
                        Email = ta.User.Email
                    }).ToList()
                };

                return Ok(taskDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<ProjectTask>> CreateTask(CreateTaskDto taskDto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var project = await _context.Projects.FindAsync(taskDto.ProjectId);

                if (project == null)
                {
                    return NotFound("Project not found");
                }

                var task = new ProjectTask
                {
                    ProjectId = taskDto.ProjectId,
                    Title = taskDto.Title,
                    Description = taskDto.Description,
                    Status = taskDto.Status,
                    Priority = taskDto.Priority,
                    StartDate = taskDto.StartDate,
                    DueDate = taskDto.DueDate,
                    CreatedById = userId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ProjectTasks.Add(task);
                await _context.SaveChangesAsync();

                // Add task assignments
                if (taskDto.Assignments != null && taskDto.Assignments.Any())
                {
                    foreach (var assignment in taskDto.Assignments)
                    {
                        var taskAssignment = new TaskAssignment
                        {
                            TaskId = task.Id,
                            UserId = assignment.UserId,
                            Role = assignment.Role,
                            AssignedAt = DateTime.UtcNow
                        };
                        _context.TaskAssignments.Add(taskAssignment);
                    }
                    await _context.SaveChangesAsync();
                }

                return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, UpdateTaskDto taskDto)
        {
            try
            {
                var task = await _context.ProjectTasks
                    .Include(t => t.TaskAssignments)
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (task == null)
                {
                    return NotFound();
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var isAdmin = userRole == "1";
                var isTaskCreator = task.CreatedById == userId;
                var isProjectOwner = await _context.Projects
                    .AnyAsync(p => p.Id == task.ProjectId && p.UserId == userId);

                if (!isAdmin && !isTaskCreator && !isProjectOwner)
                {
                    return Forbid();
                }

                task.Title = taskDto.Title;
                task.Description = taskDto.Description;
                task.Status = taskDto.Status;
                task.Priority = taskDto.Priority;
                task.StartDate = taskDto.StartDate;
                task.DueDate = taskDto.DueDate;
                task.CompletedDate = taskDto.CompletedDate;

                // Update task assignments
                _context.TaskAssignments.RemoveRange(task.TaskAssignments);
                await _context.SaveChangesAsync();

                if (taskDto.Assignments != null && taskDto.Assignments.Any())
                {
                    foreach (var assignment in taskDto.Assignments)
                    {
                        var taskAssignment = new TaskAssignment
                        {
                            TaskId = task.Id,
                            UserId = assignment.UserId,
                            Role = assignment.Role,
                            AssignedAt = DateTime.UtcNow
                        };
                        _context.TaskAssignments.Add(taskAssignment);
                    }
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                var task = await _context.ProjectTasks.FindAsync(id);
                if (task == null)
                {
                    return NotFound();
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var isAdmin = userRole == "1";
                var isTaskCreator = task.CreatedById == userId;
                var isProjectOwner = await _context.Projects
                    .AnyAsync(p => p.Id == task.ProjectId && p.UserId == userId);

                if (!isAdmin && !isTaskCreator && !isProjectOwner)
                {
                    return Forbid();
                }

                task.IsDeleted = true;
                task.DeletedAt = DateTime.UtcNow;
                _context.Entry(task).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Task {id} soft deleted by user {userId}");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("purge/{id}")]
        [Authorize(Policy = "RequireAdminRole")]
        public async Task<IActionResult> PurgeTask(int id)
        {
            try
            {
                var task = await _context.ProjectTasks.FindAsync(id);
                if (task == null)
                {
                    return NotFound();
                }

                var taskAssignments = await _context.TaskAssignments
                    .Where(ta => ta.TaskId == id)
                    .ToListAsync();

                if (taskAssignments.Any())
                {
                    _context.TaskAssignments.RemoveRange(taskAssignments);
                    await _context.SaveChangesAsync();
                }

                _context.ProjectTasks.Remove(task);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Task {id} permanently deleted by admin");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error purging task");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}