using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SzakDolgozat.Api.Models;
using SzakDolgozat.Api.Services;
using System.Text.Json;

namespace SzakDolgozat.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserProfileController : ControllerBase
    {
        private readonly UserProfileService _userProfileService;
        private readonly ILogger<UserProfileController> _logger;

        public UserProfileController(
            UserProfileService userProfileService,
            ILogger<UserProfileController> logger)
        {
            _userProfileService = userProfileService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserProfile()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _userProfileService.GetUserProfileAsync(userId);
                if (user == null)
                {
                    return NotFound();
                }

                return Ok(new
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = user.Role
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user profile");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateProfileDto model)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var success = await _userProfileService.UpdateUserProfileAsync(
                    userId, model.FirstName, model.LastName);

                if (!success)
                {
                    return BadRequest("Failed to update user profile");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto model)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var success = await _userProfileService.ChangePasswordAsync(
                    userId, model.CurrentPassword, model.NewPassword);

                if (!success)
                {
                    return BadRequest("Failed to change password");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetUserSettings()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var settings = await _userProfileService.GetUserSettingsAsync(userId);
                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user settings");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateUserSettings([FromBody] UserSettings settings)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                _logger.LogInformation("Received settings update: {settings}", JsonSerializer.Serialize(settings));

                // Ellenőrizzük a beérkező adatokat
                if (settings == null)
                {
                    return BadRequest("Settings object is null");
                }

                // Biztosítsuk, hogy a felhasználó ID-je egyezik
                settings.UserId = userId;

                // Clear User reference to avoid circular reference issues
                settings.User = null;

                var success = await _userProfileService.UpdateUserSettingsAsync(settings);
                if (!success)
                {
                    _logger.LogWarning("Failed to update user settings for user {userId}", userId);
                    return BadRequest("Failed to update user settings");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user settings");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class UpdateProfileDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}