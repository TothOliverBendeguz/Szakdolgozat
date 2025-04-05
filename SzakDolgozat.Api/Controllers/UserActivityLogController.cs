// UserActivityLogController.cs - javított verzió
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SzakDolgozat.Api.DTOs;
using SzakDolgozat.Api.Services;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SzakDolgozat.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserActivityLogController : ControllerBase
    {
        private readonly UserActivityLogService _activityLogService;
        private readonly ILogger<UserActivityLogController> _logger;

        public UserActivityLogController(
            UserActivityLogService activityLogService,
            ILogger<UserActivityLogController> logger)
        {
            _activityLogService = activityLogService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<UserActivityLogDto>> CreateActivityLog(CreateActivityLogDto logDto)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Csak admin vagy maga a felhasználó naplózhat aktivitást
                if (userRole != "1" && logDto.UserId != currentUserId)
                {
                    return Forbid();
                }

                var result = await _activityLogService.CreateActivityLog(logDto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating activity log");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<UserActivityLogDto>>> GetUserActivities(
            string userId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                // Csak admin vagy maga a felhasználó kérdezheti le az aktivitásokat
                if (userRole != "1" && userId != currentUserId)
                {
                    return Forbid();
                }

                var activities = await _activityLogService.GetUserActivitiesInDateRange(userId, startDate, endDate);
                return Ok(activities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user activities");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }
        }

        [HttpGet("all")]
        public async Task<ActionResult<IEnumerable<UserActivityLogDto>>> GetAllActivities(
            [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                // Ellenőrizzük, hogy admin-e a felhasználó
                var userRoleValue = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                _logger.LogInformation($"GetAllActivities called by user {userId} with role {userRoleValue}, startDate={startDate}, endDate={endDate}");

                // Ha nincs userRole claim vagy nem 1 (admin), akkor nem engedélyezett
                if (userRoleValue != "1")
                {
                    _logger.LogWarning($"Non-admin user {userId} with role {userRoleValue} tried to access all activities");
                    return Forbid();
                }

                try
                {
                    var activities = await _activityLogService.GetAllActivitiesInDateRange(startDate, endDate);
                    return Ok(activities);
                }
                catch (Exception innerEx)
                {
                    _logger.LogError(innerEx, "Error getting all activities in service");
                    // Hiba esetén üres listával térünk vissza, ne 500-as hibával
                    return Ok(new List<UserActivityLogDto>());
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing GetAllActivities request");
                // Súlyos hiba esetén üres listával térünk vissza, ne 500-as hibával
                return Ok(new List<UserActivityLogDto>());
            }
        }
    }
}