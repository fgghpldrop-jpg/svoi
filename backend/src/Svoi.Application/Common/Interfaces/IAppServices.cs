using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Svoi.Application.DTOs;

namespace Svoi.Application.Common.Interfaces;

public interface IH3GeoService
{
    string LatLngToH3Index(double latitude, double longitude, int resolution = 9);
    (double Latitude, double Longitude) H3IndexToLatLng(string h3Index);
    List<List<double>> GetH3BoundaryCoordinates(string h3Index);
    double CalculateDistanceMeters(double lat1, double lon1, double lat2, double lon2);
    Task ProcessPingAsync(Guid userId, GeoPingDto ping, CancellationToken ct = default);
    Task RecalculateHeatmapAsync(CancellationToken ct = default);
    Task<List<HeatmapPolygonDto>> GetHeatmapAsync(CancellationToken ct = default);
    Task<int> GetActiveWalkersCountAsync(CancellationToken ct = default);
}

public interface IClanStreakService
{
    int CalculateQuorum(int memberCount);
    Task ProcessClanStreakValidationAsync(CancellationToken ct = default);
    Task RecordUserLocationSampleAsync(Guid userId, double latitude, double longitude, CancellationToken ct = default);
    Task<BuyShieldResultDto> BuyShieldAsync(Guid userId, Guid clanId, CancellationToken ct = default);
}

public interface ITelegramAuthService
{
    Task<bool> RequestOtpCodeAsync(string phoneNumber, long? telegramChatId, CancellationToken ct = default);
    Task<(bool Success, string? Error, Guid? UserId, bool IsNewUser)> VerifyOtpCodeAsync(string phoneNumber, string code, CancellationToken ct = default);
}

public interface ILlmBioGeneratorService
{
    Task<string> GenerateBioAsync(AiBioRequestDto request, CancellationToken ct = default);
}

public interface IJwtTokenService
{
    string GenerateToken(Guid userId, string phoneNumber, string firstName);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? PhoneNumber { get; }
}
