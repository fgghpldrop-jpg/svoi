using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using H3Lib;
using H3Lib.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;
using Svoi.Domain.Entities;

namespace Svoi.Infrastructure.Services;

public class H3GeoService : IH3GeoService
{
    private readonly ISvoiDbContext _dbContext;
    private readonly IClanStreakService _streakService;
    private readonly ILogger<H3GeoService> _logger;

    public H3GeoService(
        ISvoiDbContext dbContext,
        IClanStreakService streakService,
        ILogger<H3GeoService> logger)
    {
        _dbContext = dbContext;
        _streakService = streakService;
        _logger = logger;
    }

    public string LatLngToH3Index(double latitude, double longitude, int resolution = 9)
    {
        var latRad = (decimal)(latitude * Math.PI / 180.0);
        var lonRad = (decimal)(longitude * Math.PI / 180.0);
        var coord = new GeoCoord(latRad, lonRad);
        H3Index index = Api.GeoToH3(coord, resolution);
        return index.Value.ToString("x");
    }

    public (double Latitude, double Longitude) H3IndexToLatLng(string h3Index)
    {
        if (!ulong.TryParse(h3Index, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var val))
        {
            return (0, 0);
        }
        var index = new H3Index(val);
        Api.H3ToGeo(index, out var coord);
        double lat = (double)coord.Latitude * 180.0 / Math.PI;
        double lon = (double)coord.Longitude * 180.0 / Math.PI;
        return (lat, lon);
    }

    public List<List<double>> GetH3BoundaryCoordinates(string h3Index)
    {
        var coords = new List<List<double>>();
        if (!ulong.TryParse(h3Index, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out var val))
        {
            return coords;
        }

        var index = new H3Index(val);
        Api.H3ToGeoBoundary(index, out var boundary);
        int numVerts = boundary.NumVerts;

        for (int i = 0; i < numVerts; i++)
        {
            var v = boundary.Verts[i];
            double lat = (double)v.Latitude * 180.0 / Math.PI;
            double lon = (double)v.Longitude * 180.0 / Math.PI;
            // GeoJSON polygon format: [longitude, latitude]
            coords.Add(new List<double> { lon, lat });
        }

        // Close polygon ring if not closed
        if (coords.Count > 0)
        {
            coords.Add(new List<double> { coords[0][0], coords[0][1] });
        }

        return coords;
    }

    public double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusMeters = 6371000.0;
        double dLat = (lat2 - lat1) * Math.PI / 180.0;
        double dLon = (lon2 - lon1) * Math.PI / 180.0;

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    public async Task ProcessPingAsync(Guid userId, GeoPingDto ping, CancellationToken ct = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null) return;

        // Strictly do NOT save raw GPS coordinates to permanent database tables!
        // Only convert on-the-fly to H3 index.
        if (!user.IsIncognito)
        {
            string h3Index = LatLngToH3Index(ping.Latitude, ping.Longitude, 9);
            user.LastKnownH3Index = h3Index;
            await _dbContext.SaveChangesAsync(ct);
        }

        // Forward raw location strictly to ephemeral in-memory streak detection
        await _streakService.RecordUserLocationSampleAsync(userId, ping.Latitude, ping.Longitude, ct);
    }

    public async Task RecalculateHeatmapAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Starting 3-hour batch H3 heatmap recalculation for Bobruisk...");
        var now = DateTimeOffset.UtcNow;

        // Get all active walkers who are not incognito
        var activeWalkers = await _dbContext.Users
            .Where(u => u.StatusIsWalking &&
                        !u.IsIncognito &&
                        u.LastKnownH3Index != null &&
                        (u.StatusExpiresAt == null || u.StatusExpiresAt > now))
            .Select(u => u.LastKnownH3Index!)
            .ToListAsync(ct);

        var grouped = activeWalkers
            .GroupBy(h => h)
            .Select(g => new { H3Index = g.Key, Count = g.Count() })
            .Where(g => g.Count >= 10) // Below 10 is transparent / not highlighted
            .ToList();

        // Clear previous heatmap snapshot
        var existing = await _dbContext.H3HeatmapCells.ToListAsync(ct);
        _dbContext.H3HeatmapCells.RemoveRange(existing);

        foreach (var item in grouped)
        {
            string intensity = item.Count switch
            {
                >= 10 and <= 20 => "Green",
                >= 21 and <= 40 => "Orange",
                _ => "Red"
            };

            var boundary = GetH3BoundaryCoordinates(item.H3Index);
            var boundaryJson = JsonSerializer.Serialize(boundary);

            _dbContext.H3HeatmapCells.Add(new H3HeatmapCell
            {
                H3Index = item.H3Index,
                UserCount = item.Count,
                Intensity = intensity,
                CalculatedAt = now,
                BoundaryGeoJson = boundaryJson
            });
        }

        await _dbContext.SaveChangesAsync(ct);
        _logger.LogInformation("H3 heatmap recalculated: {CellCount} zones saved.", grouped.Count);
    }

    public async Task<List<HeatmapPolygonDto>> GetHeatmapAsync(CancellationToken ct = default)
    {
        var cells = await _dbContext.H3HeatmapCells.AsNoTracking().ToListAsync(ct);
        var result = new List<HeatmapPolygonDto>();

        foreach (var cell in cells)
        {
            List<List<double>> coords;
            if (!string.IsNullOrEmpty(cell.BoundaryGeoJson))
            {
                coords = JsonSerializer.Deserialize<List<List<double>>>(cell.BoundaryGeoJson) ?? GetH3BoundaryCoordinates(cell.H3Index);
            }
            else
            {
                coords = GetH3BoundaryCoordinates(cell.H3Index);
            }

            result.Add(new HeatmapPolygonDto(
                cell.H3Index,
                cell.UserCount,
                cell.Intensity,
                coords
            ));
        }

        return result;
    }

    public async Task<int> GetActiveWalkersCountAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        return await _dbContext.Users
            .CountAsync(u => u.StatusIsWalking && (u.StatusExpiresAt == null || u.StatusExpiresAt > now), ct);
    }
}
