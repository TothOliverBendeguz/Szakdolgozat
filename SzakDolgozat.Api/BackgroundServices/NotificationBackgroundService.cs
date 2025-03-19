using SzakDolgozat.Api.Services;

namespace SzakDolgozat.Api.BackgroundServices
{
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificationBackgroundService> _logger;
        private readonly TimeSpan _period = TimeSpan.FromHours(24); 

        public NotificationBackgroundService(IServiceScopeFactory scopeFactory, ILogger<NotificationBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;

            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                _period = TimeSpan.FromHours(12); 
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using PeriodicTimer timer = new PeriodicTimer(_period);

            await GenerateNotificationsAsync();

            try
            {
                while (await timer.WaitForNextTickAsync(stoppingToken))
                {
                    await GenerateNotificationsAsync();
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Notification background service was stopped");
            }
        }

        private async Task GenerateNotificationsAsync()
        {
            try
            {
                _logger.LogInformation("Starting notification generation at: {time}", DateTimeOffset.Now);

                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

                await notificationService.GenerateDeadlineNotificationsAsync();

                _logger.LogInformation("Notification generation completed at: {time}", DateTimeOffset.Now);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating notifications");
            }
        }
    }
}