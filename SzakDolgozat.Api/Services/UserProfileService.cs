using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SzakDolgozat.Api.Data;
using SzakDolgozat.Api.Models;
using System.Threading.Tasks;

namespace SzakDolgozat.Api.Services
{
    public class UserProfileService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly ILogger<UserProfileService> _logger;

        public UserProfileService(
            ApplicationDbContext context,
            UserManager<User> userManager,
            ILogger<UserProfileService> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<User> GetUserProfileAsync(string userId)
        {
            return await _userManager.FindByIdAsync(userId);
        }

        public async Task<bool> UpdateUserProfileAsync(string userId, string firstName, string lastName)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                user.FirstName = firstName;
                user.LastName = lastName;

                var result = await _userManager.UpdateAsync(user);
                return result.Succeeded;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user profile");
                return false;
            }
        }

        public async Task<bool> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
                return result.Succeeded;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password");
                return false;
            }
        }

        public async Task<UserSettings> GetUserSettingsAsync(string userId)
        {
            var settings = await _context.UserSettings
                .FirstOrDefaultAsync(us => us.UserId == userId);

            if (settings == null)
            {
                settings = new UserSettings
                {
                    UserId = userId,
                    DefaultProjectView = "card",
                    DefaultGraphView = "all",
                    UiTheme = "light"
                };

                _context.UserSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return settings;
        }

        public async Task<bool> UpdateUserSettingsAsync(UserSettings settings)
        {
            try
            {
                var existingSettings = await _context.UserSettings
                    .FirstOrDefaultAsync(us => us.UserId == settings.UserId);

                if (existingSettings == null)
                {
                    settings.User = null;
                    _context.UserSettings.Add(settings);
                }
                else
                {
                    existingSettings.DefaultProjectView = settings.DefaultProjectView;
                    existingSettings.DefaultGraphView = settings.DefaultGraphView;
                    existingSettings.UiTheme = settings.UiTheme;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user settings");
                return false;
            }
        }
    }
}