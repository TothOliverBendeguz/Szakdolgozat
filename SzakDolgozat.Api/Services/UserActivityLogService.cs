using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SzakDolgozat.Api.Data;
using SzakDolgozat.Api.DTOs;
using SzakDolgozat.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SzakDolgozat.Api.Services
{
    public class UserActivityLogService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserActivityLogService> _logger;

        public UserActivityLogService(ApplicationDbContext context, ILogger<UserActivityLogService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<UserActivityLogDto> CreateActivityLog(CreateActivityLogDto logDto)
        {
            try
            {
                // Lekérjük a kapcsolódó projekt és feladat adatait
                string projectName = string.Empty;
                string taskName = string.Empty;

                if (logDto.ProjectId.HasValue)
                {
                    var project = await _context.Projects.FindAsync(logDto.ProjectId.Value);
                    if (project != null)
                    {
                        projectName = project.Name;
                    }
                }

                if (logDto.TaskId.HasValue)
                {
                    var task = await _context.ProjectTasks.FindAsync(logDto.TaskId.Value);
                    if (task != null)
                    {
                        taskName = task.Title;
                    }
                }

                // Létrehozzuk az új aktivitás naplót
                var activityLog = new UserActivityLog
                {
                    UserId = logDto.UserId,
                    ProjectId = logDto.ProjectId,
                    TaskId = logDto.TaskId,
                    StartDate = logDto.StartDate,
                    EndDate = logDto.EndDate,
                    Description = logDto.Description,
                    ProjectName = projectName,
                    TaskName = taskName,
                    IsProjectDeleted = false,
                    IsTaskDeleted = false
                };

                _context.UserActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();

                // Lekérjük a felhasználó adatait a válaszhoz
                var user = await _context.Users.FindAsync(logDto.UserId);

                // Visszaadjuk a létrehozott aktivitás adatait
                return new UserActivityLogDto
                {
                    Id = activityLog.Id,
                    UserId = activityLog.UserId,
                    UserName = user?.UserName,
                    UserEmail = user?.Email,
                    ProjectId = activityLog.ProjectId,
                    ProjectName = activityLog.ProjectName,
                    TaskId = activityLog.TaskId,
                    TaskName = activityLog.TaskName,
                    StartDate = activityLog.StartDate,
                    EndDate = activityLog.EndDate,
                    Description = activityLog.Description,
                    IsProjectDeleted = activityLog.IsProjectDeleted,
                    IsTaskDeleted = activityLog.IsTaskDeleted
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating activity log");
                throw;
            }
        }

        public async Task<List<UserActivityLogDto>> GetUserActivitiesInDateRange(string userId, DateTime startDate, DateTime endDate)
        {
            try
            {
                _logger.LogInformation($"Getting user activities for user {userId} from {startDate} to {endDate}");

                var activities = await _context.UserActivityLogs
                    .Include(al => al.User)
                    .Where(al => al.UserId == userId &&
                                 ((al.StartDate >= startDate && al.StartDate <= endDate) ||
                                  (al.EndDate >= startDate && al.EndDate <= endDate) ||
                                  (al.StartDate <= startDate && al.EndDate >= endDate)))
                    .OrderBy(al => al.StartDate)
                    .ToListAsync();

                return activities.Select(al => new UserActivityLogDto
                {
                    Id = al.Id,
                    UserId = al.UserId,
                    UserName = al.User?.UserName ?? "Unknown",
                    UserEmail = al.User?.Email ?? "Unknown",
                    ProjectId = al.ProjectId,
                    ProjectName = al.ProjectName ?? "Unknown",
                    TaskId = al.TaskId,
                    TaskName = al.TaskName ?? "Unknown",
                    StartDate = al.StartDate,
                    EndDate = al.EndDate,
                    Description = al.Description ?? "",
                    IsProjectDeleted = al.IsProjectDeleted,
                    IsTaskDeleted = al.IsTaskDeleted
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user activities");
                throw;
            }
        }

        public async Task<List<UserActivityLogDto>> GetAllActivitiesInDateRange(DateTime startDate, DateTime endDate)
        {
            try
            {
                _logger.LogInformation($"Getting all activities from {startDate} to {endDate}");

                var activities = await _context.UserActivityLogs
                    .Include(al => al.User)
                    .Where(al => (al.StartDate >= startDate && al.StartDate <= endDate) ||
                                 (al.EndDate >= startDate && al.EndDate <= endDate) ||
                                 (al.StartDate <= startDate && al.EndDate >= endDate))
                    .OrderBy(al => al.StartDate)
                    .ToListAsync();

                return activities.Select(al => new UserActivityLogDto
                {
                    Id = al.Id,
                    UserId = al.UserId,
                    UserName = al.User?.UserName ?? "Unknown",
                    UserEmail = al.User?.Email ?? "Unknown",
                    ProjectId = al.ProjectId,
                    ProjectName = al.ProjectName ?? "Unknown",
                    TaskId = al.TaskId,
                    TaskName = al.TaskName ?? "Unknown",
                    StartDate = al.StartDate,
                    EndDate = al.EndDate,
                    Description = al.Description ?? "",
                    IsProjectDeleted = al.IsProjectDeleted,
                    IsTaskDeleted = al.IsTaskDeleted
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all activities: {ErrorMessage}", ex.Message);
                // Ne dobjunk kivételt, hanem adjunk vissza üres listát
                return new List<UserActivityLogDto>();
            }
        }

        // Projekt vagy feladat törlésekor frissítsük a kapcsolódó aktivitás naplókat
        public async Task UpdateForDeletedProject(int projectId)
        {
            try
            {
                var projectLogs = await _context.UserActivityLogs
                    .Where(al => al.ProjectId == projectId)
                    .ToListAsync();

                foreach (var log in projectLogs)
                {
                    log.IsProjectDeleted = true;
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating activity logs for deleted project {projectId}");
                throw;
            }
        }

        public async Task UpdateForDeletedTask(int taskId)
        {
            try
            {
                var taskLogs = await _context.UserActivityLogs
                    .Where(al => al.TaskId == taskId)
                    .ToListAsync();

                foreach (var log in taskLogs)
                {
                    log.IsTaskDeleted = true;
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating activity logs for deleted task {taskId}");
                throw;
            }
        }
    }
}