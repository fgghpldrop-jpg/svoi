using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Svoi.Application.Common.Interfaces;

namespace Svoi.Infrastructure.BackgroundWorkers;

public class HeatmapRecalculationWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<HeatmapRecalculationWorker> _logger;

    public HeatmapRecalculationWorker(
        IServiceProvider serviceProvider,
        ILogger<HeatmapRecalculationWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HeatmapRecalculationWorker started. Running scheduled 3-hour batch H3 calculations (00:00, 03:00, 06:00, etc.).");

        // Perform an initial recalculation on startup
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var geoService = scope.ServiceProvider.GetRequiredService<IH3GeoService>();
            await geoService.RecalculateHeatmapAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing initial heatmap calculation on startup");
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = CalculateDelayUntilNextThreeHourWindow();
            _logger.LogInformation("Next H3 heatmap batch recalculation scheduled in {Hours} hours and {Minutes} minutes.",
                delay.Hours, delay.Minutes);

            try
            {
                await Task.Delay(delay, stoppingToken);

                using var scope = _serviceProvider.CreateScope();
                var geoService = scope.ServiceProvider.GetRequiredService<IH3GeoService>();
                await geoService.RecalculateHeatmapAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during scheduled H3 heatmap batch recalculation");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }

    private static TimeSpan CalculateDelayUntilNextThreeHourWindow()
    {
        var now = DateTimeOffset.UtcNow;
        int currentHour = now.Hour;
        int nextHour = ((currentHour / 3) + 1) * 3;

        DateTimeOffset nextTarget;
        if (nextHour >= 24)
        {
            nextTarget = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.Zero).AddDays(1);
        }
        else
        {
            nextTarget = new DateTimeOffset(now.Year, now.Month, now.Day, nextHour, 0, 0, TimeSpan.Zero);
        }

        var delay = nextTarget - now;
        return delay > TimeSpan.Zero ? delay : TimeSpan.FromHours(3);
    }
}
