using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Svoi.Application.Common.Interfaces;

namespace Svoi.Infrastructure.BackgroundWorkers;

public class ClanStreakValidationWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ClanStreakValidationWorker> _logger;

    public ClanStreakValidationWorker(
        IServiceProvider serviceProvider,
        ILogger<ClanStreakValidationWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ClanStreakValidationWorker started. Monitoring clan walk quorums (<= 30m, >= 30min).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var streakService = scope.ServiceProvider.GetRequiredService<IClanStreakService>();
                await streakService.ProcessClanStreakValidationAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while validating clan streaks in background");
            }

            // Check every 30 seconds
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
