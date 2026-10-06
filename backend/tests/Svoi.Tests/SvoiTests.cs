using System;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Svoi.Application.Common.Interfaces;
using Svoi.Infrastructure.Services;
using Xunit;

namespace Svoi.Tests;

public class SvoiCoreTests
{
    [Theory]
    [InlineData(10, 6)]  // CEIL(10 * 0.6) = 6
    [InlineData(5, 3)]   // CEIL(5 * 0.6) = 3
    [InlineData(2, 2)]   // MAX(2, CEIL(2 * 0.6)) = 2
    [InlineData(3, 2)]   // MAX(2, CEIL(3 * 0.6) = 2) = 2
    [InlineData(15, 9)]  // CEIL(15 * 0.6) = 9
    public void QuorumCalculation_Matches_Tz_Formula(int memberCount, int expectedQuorum)
    {
        var mockDb = new Mock<ISvoiDbContext>();
        var streakService = new ClanStreakService(mockDb.Object, NullLogger<ClanStreakService>.Instance);

        int quorum = streakService.CalculateQuorum(memberCount);

        Assert.Equal(expectedQuorum, quorum);
    }

    [Fact]
    public void H3GeoService_Converts_Bobruisk_Coordinates()
    {
        var mockDb = new Mock<ISvoiDbContext>();
        var mockStreak = new Mock<IClanStreakService>();
        var geoService = new H3GeoService(mockDb.Object, mockStreak.Object, NullLogger<H3GeoService>.Instance);

        double bobruiskLat = 53.1384;
        double bobruiskLon = 29.2214;

        string h3Index = geoService.LatLngToH3Index(bobruiskLat, bobruiskLon, 9);

        Assert.False(string.IsNullOrWhiteSpace(h3Index));

        // Convert back
        var (lat, lon) = geoService.H3IndexToLatLng(h3Index);

        // Tolerance within ~100m for resolution 9
        Assert.InRange(lat, 53.13, 53.15);
        Assert.InRange(lon, 29.21, 29.23);

        // Boundary
        var boundary = geoService.GetH3BoundaryCoordinates(h3Index);
        Assert.NotEmpty(boundary);
        Assert.True(boundary.Count >= 6);
    }

    [Fact]
    public void Haversine_Distance_Meets_Threshold()
    {
        var mockDb = new Mock<ISvoiDbContext>();
        var mockStreak = new Mock<IClanStreakService>();
        var geoService = new H3GeoService(mockDb.Object, mockStreak.Object, NullLogger<H3GeoService>.Instance);

        // Two points on Socialka ~15 meters apart
        double lat1 = 53.13780;
        double lon1 = 29.22450;
        double lat2 = 53.13790;
        double lon2 = 29.22460;

        double distance = geoService.CalculateDistanceMeters(lat1, lon1, lat2, lon2);

        Assert.True(distance < 30.0, $"Expected distance < 30m, but got {distance}m");
    }
}
