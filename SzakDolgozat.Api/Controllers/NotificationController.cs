using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SzakDolgozat.Api.Data;
using SzakDolgozat.Api.Models;
using SzakDolgozat.Api.Services;
using SzakDolgozat.Api.Services.Email;

namespace SzakDolgozat.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;
        private readonly ApplicationDbContext _context; 
        private readonly IEmailService _emailService; 

    public NotificationController(
        NotificationService notificationService,
        ILogger<NotificationController> logger,
        ApplicationDbContext context, 
        IEmailService emailService) 
    {
        _notificationService = notificationService;
        _logger = logger;
        _context = context;
        _emailService = emailService;
    }
    

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications([FromQuery] bool unreadOnly = false, [FromQuery] int limit = 0)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var notifications = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly, limit);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var count = await _notificationService.GetUnreadCountAsync(userId);
                return Ok(count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var success = await _notificationService.MarkAsReadAsync(id, userId);

                if (!success)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var count = await _notificationService.MarkAllAsReadAsync(userId);
                return Ok(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var success = await _notificationService.DeleteNotificationAsync(id, userId);

                if (!success)
                {
                    return NotFound();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("preferences")]
        public async Task<ActionResult<NotificationPreference>> GetPreferences()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var preferences = await _notificationService.GetOrCreateUserPreferenceAsync(userId);
                return Ok(preferences);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification preferences");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("preferences")]
        public async Task<ActionResult<NotificationPreference>> UpdatePreferences(NotificationPreference preference)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                if (preference.UserId != userId)
                {
                    preference.UserId = userId; 
                }

           
                var preferenceToSave = new NotificationPreference
                {
                    Id = preference.Id,
                    UserId = userId,
                    Enabled = preference.Enabled,
                    DaysBeforeDeadline = preference.DaysBeforeDeadline,
                    FrequencyInDays = preference.FrequencyInDays,
                    OnlyActiveProjects = preference.OnlyActiveProjects,
                    OnlyAssignedProjects = preference.OnlyAssignedProjects,
                    AlwaysNotifyOneDayBefore = preference.AlwaysNotifyOneDayBefore
                };

                var updatedPreference = await _notificationService.UpdateUserPreferenceAsync(preferenceToSave);
                return Ok(updatedPreference);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification preferences");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

    /*    [HttpPost("generate-test")]
        public async Task<IActionResult> GenerateTestNotifications()
        {
            try
            {
                await _notificationService.GenerateDeadlineNotificationsAsync();
                return Ok(new { message = "Test notifications generated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating test notifications");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        */


        [HttpGet("generate-test-public")]
        [AllowAnonymous]
        public async Task<IActionResult> GenerateTestPublic()
        {
            try
            {
                await _notificationService.GenerateDeadlineNotificationsAsync();
                return Ok(new { message = "Test notifications generated" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating test notifications");
                return StatusCode(500, new { message = "Error generating test notifications: " + ex.Message });
            }
        }





        //email teszt2
        [HttpGet("test-email-public")]
        [AllowAnonymous]
        public async Task<IActionResult> TestEmailPublic()
        {
            try
            {
                string yourEmail = "tesztemail123@gmail.hu";

                var result = await _emailService.SendEmailAsync(
                    yourEmail,
                    "Teszt email a SzakDolgozat alkalmazásból",
                    @"<html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #3f51b5; color: white; padding: 10px 20px; }
                    .content { padding: 20px; background-color: #f8f9fa; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>Teszt Email</h2>
                    </div>
                    <div class='content'>
                        <h3>Kedves Felhasználó!</h3>
                        <p>Ez egy teszt email a SzakDolgozat email értesítő rendszeréből.</p>
                        <p>Ha ezt az emailt megkaptad, az értesítési rendszer megfelelően működik.</p>
                    </div>
                    <div class='footer'>
                        <p>Ez egy automatikus értesítés a SzakDolgozat projektmenedzsment rendszertől.</p>
                    </div>
                </div>
            </body>
            </html>");

                if (result)
                    return Ok(new { success = true, message = "Email sikeresen elküldve a következő címre: " + yourEmail });
                else
                    return StatusCode(500, new { success = false, message = "Hiba történt az email küldés során. Ellenőrizd a szerver naplóit!" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in test email public");
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }
    }
}