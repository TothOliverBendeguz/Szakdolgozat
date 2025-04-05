using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SzakDolgozat.Api.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

namespace SzakDolgozat.Api.Controllers
{
    [Authorize(Policy = "RequireAdminRole")]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UserController> _logger;

        public UserController(
            UserManager<User> userManager,
            ILogger<UserController> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            try
            {
                _logger.LogInformation("Fetching all users");
                var users = await _userManager.Users.ToListAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<User>>> SearchUsers([FromQuery] string query)
        {
            try
            {
                var users = await _userManager.Users
                    .Where(u => u.UserName.Contains(query) || u.Email.Contains(query))
                    .ToListAsync();
                _logger.LogInformation($"Found {users.Count} users matching query: {query}");
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching users");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("filter")]
        public async Task<ActionResult<IEnumerable<User>>> FilterByRole([FromQuery] UserRole role)
        {
            try
            {
                var users = await _userManager.Users
                    .Where(u => u.Role == (int)role)
                    .ToListAsync();
                _logger.LogInformation($"Found {users.Count} users with role: {role}");
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error filtering users by role");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(string id, [FromBody] UpdateRoleModel model)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    _logger.LogWarning($"User not found with ID: {id}");
                    return NotFound();
                }

                if (user.Role == (int)UserRole.Admin && model.Role != UserRole.Admin)
                {
                    var adminCount = await _userManager.Users
                        .CountAsync(u => u.Role == (int)UserRole.Admin);

                    if (adminCount <= 1)
                    {
                        return BadRequest(new { message = "Cannot remove the last admin user" });
                    }
                }

                user.Role = (int)model.Role;
                var result = await _userManager.UpdateAsync(user);

                if (!result.Succeeded)
                {
                    _logger.LogError($"Failed to update user role: {string.Join(", ", result.Errors)}");
                    return BadRequest(new { message = "Failed to update user role" });
                }

                await UpdateUserIdentityRole(user, model.Role);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user role");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }


        [HttpGet("current")]
        [AllowAnonymous] 
        public async Task<ActionResult<object>> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Ok(new
                    {
                        Id = "",
                        UserName = "Guest",
                        Email = "",
                        Role = 3 
                    });
                }

                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return Ok(new
                    {
                        Id = userId,
                        UserName = "Unknown",
                        Email = "",
                        Role = 3 
                    });
                }

                return Ok(new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    user.Role
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                if (user.Role == (int)UserRole.Admin)
                {
                    var adminCount = await _userManager.Users
                        .CountAsync(u => u.Role == (int)UserRole.Admin);

                    if (adminCount <= 1)
                    {
                        return BadRequest(new { message = "Cannot delete the last admin user" });
                    }
                }

                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded)
                {
                    return BadRequest(new { message = "Failed to delete user" });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }




        private async Task UpdateUserIdentityRole(User user, UserRole newRole)
        {
            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, newRole.ToString());
        }
    }

    public class UpdateRoleModel
    {
        public UserRole Role { get; set; }
    }
}