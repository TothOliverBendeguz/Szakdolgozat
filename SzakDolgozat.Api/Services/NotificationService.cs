using Microsoft.EntityFrameworkCore;
using SzakDolgozat.Api.Data;
using SzakDolgozat.Api.Models;
using SzakDolgozat.Api.Services.Email;

namespace SzakDolgozat.Api.Services
{
    public class NotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotificationService> _logger;
        private readonly IEmailService _emailService;

        public NotificationService(
            ApplicationDbContext context,
            ILogger<NotificationService> logger,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }


        public async Task<List<Notification>> GetUserNotificationsAsync(string userId, bool unreadOnly = false, int limit = 0)
        {
            IQueryable<Notification> query = _context.Notifications
                .Include(n => n.Project)
                .Where(n => n.UserId == userId);

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            query = query.OrderByDescending(n => n.CreatedAt); 
            if (limit > 0)
            {
                query = query.Take(limit);
            }

            return await query.ToListAsync();
        }



        public async Task<bool> MarkAsReadAsync(int notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
            {
                return false;
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<int> MarkAllAsReadAsync(string userId)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return unreadNotifications.Count;
        }


        public async Task<Notification> CreateNotificationAsync(Notification notification)
        {
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
            return notification;
        }


        public async Task GenerateDeadlineNotificationsAsync()
        {
            try
            {
                var preferences = await _context.NotificationPreferences
                    .Where(p => p.Enabled)
                    .Include(p => p.User)
                    .ToListAsync();

                var allProjects = await _context.Projects
                    .Include(p => p.ProjectUsers)
                    .ThenInclude(pu => pu.User)
                    .ToListAsync();

                var today = DateTime.UtcNow.Date;
                var emailsSent = 0;
                var notificationsCreated = 0;

                foreach (var preference in preferences)
                {
                    var userProjects = allProjects;

                    if (preference.OnlyActiveProjects)
                    {
                        userProjects = userProjects.Where(p => p.IsActive).ToList();
                    }

                    if (preference.OnlyAssignedProjects)
                    {
                        userProjects = userProjects
                            .Where(p => p.UserId == preference.UserId ||
                                   p.ProjectUsers.Any(pu => pu.UserId == preference.UserId))
                            .ToList();
                    }

                    foreach (var project in userProjects)
                    {
                        var daysUntilDeadline = (project.PlannedEndDate.Date - today).TotalDays;

                        if (daysUntilDeadline == 1 && preference.AlwaysNotifyOneDayBefore)
                        {
                            var alreadySentTodayOneDayNotification = await _context.Notifications
                                .AnyAsync(n => n.UserId == preference.UserId &&
                                        n.ProjectId == project.Id &&
                                        n.Type == "deadline-1day" &&
                                        n.CreatedAt.Date == today);

                            if (!alreadySentTodayOneDayNotification)
                            {
                                var notification = new Notification
                                {
                                    UserId = preference.UserId,
                                    ProjectId = project.Id,
                                    Title = "FIGYELEM: Holnap lejár a határidő!",
                                    Message = $"A(z) \"{project.Name}\" projekt határideje holnap lejár!",
                                    Type = "deadline-1day",
                                    CreatedAt = DateTime.UtcNow,
                                    IsRead = false
                                };

                                _context.Notifications.Add(notification);
                                notificationsCreated++;
                                _logger.LogInformation($"1 napos értesítés létrehozva: {notification.Message} felhasználónak: {preference.UserId}");

                                if (preference.EmailEnabled)
                                {
                                    await _emailService.SendProjectDeadlineEmailAsync(preference.User, project, 1);
                                    emailsSent++;
                                }
                            }
                        }

                        if (daysUntilDeadline >= 0 && daysUntilDeadline <= preference.DaysBeforeDeadline)
                        {
                            var lastNotification = await _context.Notifications
                                .Where(n => n.UserId == preference.UserId &&
                                       n.ProjectId == project.Id &&
                                       n.Type == "deadline")
                                .OrderByDescending(n => n.CreatedAt)
                                .FirstOrDefaultAsync();

                            var shouldSendNotification = false;

                            if (lastNotification == null)
                            {
                                shouldSendNotification = true;
                            }
                            else
                            {
                                var daysSinceLastNotification = (today - lastNotification.CreatedAt.Date).TotalDays;
                                shouldSendNotification = daysSinceLastNotification >= preference.FrequencyInDays;
                            }

                            if (shouldSendNotification)
                            {
                                var daysText = daysUntilDeadline == 0 ? "ma" :
                                              (daysUntilDeadline == 1 ? "holnap" :
                                              $"{(int)daysUntilDeadline} nap múlva");

                                var notification = new Notification
                                {
                                    UserId = preference.UserId,
                                    ProjectId = project.Id,
                                    Title = "Közelgő projekthatáridő",
                                    Message = $"A(z) \"{project.Name}\" projekt határideje {daysText} lejár.",
                                    Type = "deadline",
                                    CreatedAt = DateTime.UtcNow,
                                    IsRead = false
                                };

                                _context.Notifications.Add(notification);
                                notificationsCreated++;
                                _logger.LogInformation($"Határidő értesítés létrehozva: {notification.Message} felhasználónak: {preference.UserId}");

                                if (preference.EmailEnabled)
                                {
                                    bool shouldSendEmail = true;

                                    if (preference.EmailFrequencyInDays > preference.FrequencyInDays)
                                    {
                                        var lastEmailDate = await _context.Notifications
                                            .Where(n => n.UserId == preference.UserId &&
                                                   n.ProjectId == project.Id &&
                                                   n.Type == "email-sent")
                                            .OrderByDescending(n => n.CreatedAt)
                                            .Select(n => n.CreatedAt.Date)
                                            .FirstOrDefaultAsync();

                                        if (lastEmailDate != default)
                                        {
                                            var daysSinceLastEmail = (today - lastEmailDate).TotalDays;
                                            shouldSendEmail = daysSinceLastEmail >= preference.EmailFrequencyInDays;
                                        }
                                    }

                                    if (shouldSendEmail)
                                    {
                                        await _emailService.SendProjectDeadlineEmailAsync(
                                            preference.User,
                                            project,
                                            (int)daysUntilDeadline);

                                        _context.Notifications.Add(new Notification
                                        {
                                            UserId = preference.UserId,
                                            ProjectId = project.Id,
                                            Title = "Email értesítés elküldve",
                                            Message = $"Email értesítés a {project.Name} projektről",
                                            Type = "email-sent",
                                            CreatedAt = DateTime.UtcNow,
                                            IsRead = true 
                                        });

                                        emailsSent++;
                                    }
                                }
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Értesítés generálás befejezve. {notificationsCreated} értesítés létrehozva és {emailsSent} email elküldve.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hiba történt az értesítések generálása közben");
                throw;
            }
        }


        public async Task<NotificationPreference> GetOrCreateUserPreferenceAsync(string userId)
        {
            var preference = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (preference == null)
            {
                preference = new NotificationPreference
                {
                    UserId = userId,
                    Enabled = true,
                    DaysBeforeDeadline = 30,
                    FrequencyInDays = 7,
                    OnlyActiveProjects = true,
                    OnlyAssignedProjects = false
                };

                _context.NotificationPreferences.Add(preference);
                await _context.SaveChangesAsync();
            }

            return preference;
        }


        public async Task<NotificationPreference> UpdateUserPreferenceAsync(NotificationPreference preference)
        {
            var existingPreference = await _context.NotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == preference.UserId);

            if (existingPreference == null)
            {
                preference.User = null;
                _context.NotificationPreferences.Add(preference);
            }
            else
            {
                existingPreference.Enabled = preference.Enabled;
                existingPreference.DaysBeforeDeadline = preference.DaysBeforeDeadline;
                existingPreference.FrequencyInDays = preference.FrequencyInDays;
                existingPreference.OnlyActiveProjects = preference.OnlyActiveProjects;
                existingPreference.OnlyAssignedProjects = preference.OnlyAssignedProjects;


                _context.NotificationPreferences.Update(existingPreference);
            }

            await _context.SaveChangesAsync();
            return preference;
        }


        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }


        public async Task<bool> DeleteNotificationAsync(int notificationId, string userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
            {
                return false;
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}