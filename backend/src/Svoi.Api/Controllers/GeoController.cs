using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;

namespace Svoi.Api.Controllers;

[ApiController]
[Route("api/v1/geo")]
[Authorize]
public class GeoController : ControllerBase
{
    private readonly IH3GeoService _geoService;
    private readonly ICurrentUserService _currentUser;

    public GeoController(IH3GeoService geoService, ICurrentUserService currentUser)
    {
        _geoService = geoService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Отправка гео-пинга. Сырые координаты НИКОГДА не сохраняются в БД —
    /// только H3-индекс ячейки (разрешение 9, ~174м²).
    /// </summary>
    [HttpPost("ping")]
    public async Task<IActionResult> Ping([FromBody] GeoPingDto ping, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        // BUG FIX: Added coordinate bounds validation.
        // Previously any value (including NaN/Infinity) silently passed to H3Lib.
        if (ping.Latitude is < -90.0 or > 90.0 || ping.Longitude is < -180.0 or > 180.0)
        {
            return BadRequest(new
            {
                error = "Некорректные координаты",
                detail = "Latitude должна быть [-90, 90], Longitude [-180, 180]"
            });
        }

        // Convert GPS → H3 index without saving raw coordinates to DB
        await _geoService.ProcessPingAsync(userId.Value, ping, ct);

        return Ok(new
        {
            success = true,
            h3Index = _geoService.LatLngToH3Index(ping.Latitude, ping.Longitude, 9)
        });
    }
}
