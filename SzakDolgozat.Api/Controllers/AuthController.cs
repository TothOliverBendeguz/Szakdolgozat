using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SzakDolgozat.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace SzakDolgozat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = new User
            {
                UserName = model.Username,
                Email = model.Email,
                Role = (int)UserRole.Reader 
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                await _signInManager.SignInAsync(user, isPersistent: false);
                var token = GenerateJwtToken(user);
                return Ok(new { token, role = user.Role, message = "Sikeres regisztráció!" });
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }

            return BadRequest(ModelState);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            try
            {
                if (model == null || string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Password))
                {
                    return BadRequest("Invalid login data");
                }

                var user = await _userManager.FindByNameAsync(model.Username);
                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                var result = await _signInManager.PasswordSignInAsync(user, model.Password, isPersistent: false, lockoutOnFailure: false);

                if (result.Succeeded)
                {
                    var token = GenerateJwtToken(user);
                    return Ok(new { token, role = user.Role, message = "Login successful" });
                }

                return Unauthorized(new { message = "Invalid username or password" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while logging in", error = ex.Message });
            }
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new List<Claim>
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id),
        new Claim(ClaimTypes.Name, user.UserName),
        new Claim(ClaimTypes.Email, user.Email),
        new Claim(ClaimTypes.Role, user.Role.ToString())
    };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.Now.AddDays(Convert.ToDouble(_configuration["Jwt:ExpireDays"]));

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterModel
    {
        [Required(ErrorMessage = "A felhasználónév kötelező")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Az email cím kötelező")]
        [EmailAddress(ErrorMessage = "Érvénytelen email cím")]
        public string Email { get; set; }

        [Required(ErrorMessage = "A jelszó kötelező")]
        [StringLength(100, ErrorMessage = "A jelszónak legalább {2} karakter hosszúnak kell lennie.", MinimumLength = 6)]
        public string Password { get; set; }
    }

    public class LoginModel
    {
        [Required(ErrorMessage = "A felhasználónév kötelező")]
        public string Username { get; set; }

        [Required(ErrorMessage = "A jelszó kötelező")]
        public string Password { get; set; }
    }
}