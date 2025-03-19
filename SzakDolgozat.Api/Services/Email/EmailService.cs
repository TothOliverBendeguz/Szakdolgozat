using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;
using SzakDolgozat.Api.Models;

namespace SzakDolgozat.Api.Services.Email
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task<bool> SendEmailAsync(string to, string subject, string htmlContent)
        {
            if (!_emailSettings.Enabled)
            {
                _logger.LogInformation("Email sending is disabled. Would have sent email to {To} with subject {Subject}", to, subject);
                return true; 
            }

            var client = new SendGridClient(_emailSettings.SendGridApiKey);
            var from = new EmailAddress(_emailSettings.FromEmail, _emailSettings.FromName);
            var toAddress = new EmailAddress(to);
            var msg = MailHelper.CreateSingleEmail(from, toAddress, subject, null, htmlContent);

            try
            {
                var response = await client.SendEmailAsync(msg);
                var isSuccess = response.StatusCode == System.Net.HttpStatusCode.Accepted
                              || response.StatusCode == System.Net.HttpStatusCode.OK;

                if (!isSuccess)
                {
                    var responseBody = await response.Body.ReadAsStringAsync();
                    _logger.LogError("Failed to send email. Status Code: {StatusCode}, Response: {Response}",
                        response.StatusCode, responseBody);
                }

                return isSuccess;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {To}", to);
                return false;
            }
        }

        public async Task SendProjectDeadlineEmailAsync(User user, Project project, int daysRemaining)
        {
            var subject = $"Közelgő határidő: {project.Name}";
            var daysText = daysRemaining == 0 ? "ma" :
                          (daysRemaining == 1 ? "holnap" :
                          $"{daysRemaining} nap múlva");

            var htmlContent = $@"
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #3f51b5; color: white; padding: 10px 20px; }}
                    .content {{ padding: 20px; background-color: #f8f9fa; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                    .btn {{ display: inline-block; padding: 10px 20px; background-color: #3f51b5; color: white; text-decoration: none; border-radius: 4px; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>Projekt Határidő Értesítés</h2>
                    </div>
                    <div class='content'>
                        <h3>Kedves {user.UserName}!</h3>
                        <p>Értesítjük, hogy a <strong>{project.Name}</strong> nevű projekt határideje {daysText} lejár ({project.PlannedEndDate.ToShortDateString()}).</p>
                        <p>Projekt részletek:</p>
                        <ul>
                            <li><strong>Projektvezető:</strong> {project.ProjectManager}</li>
                            <li><strong>Kezdés dátuma:</strong> {project.StartDate.ToShortDateString()}</li>
                            <li><strong>Határidő:</strong> {project.PlannedEndDate.ToShortDateString()}</li>
                        </ul>
                        <p style='margin-top: 30px;'>
                            <a href='https://localhost:4200/projects' class='btn'>Ugrás a projektre</a>
                        </p>
                    </div>
                    <div class='footer'>
                        <p>Ez egy automatikus értesítés.</p>
                        <p>Ha nem szeretne ilyen emaileket kapni, kérjük módosítsa az értesítési beállításokat.</p>
                    </div>
                </div>
            </body>
            </html>";

            await SendEmailAsync(user.Email, subject, htmlContent);
            _logger.LogInformation("Project deadline email sent to {Email} for project {ProjectName}", user.Email, project.Name);
        }
    }

    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string to, string subject, string htmlContent);
        Task SendProjectDeadlineEmailAsync(User user, Project project, int daysRemaining);
    }
}