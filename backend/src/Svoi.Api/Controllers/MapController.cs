using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;

namespace Svoi.Api.Controllers;

[ApiController]
[Route("api/v1/map")]
public class MapController : ControllerBase
{
    private readonly IH3GeoService _geoService;
    private readonly ISvoiDbContext _dbContext;

    public MapController(IH3GeoService geoService, ISvoiDbContext dbContext)
    {
        _geoService = geoService;
        _dbContext = dbContext;
    }

    [HttpGet("heatmap")]
    public async Task<IActionResult> GetHeatmap(CancellationToken ct)
    {
        var polygons = await _geoService.GetHeatmapAsync(ct);
        return Ok(polygons);
    }

    [HttpGet("walkers-count")]
    public async Task<IActionResult> GetWalkersCount(CancellationToken ct)
    {
        var count = await _geoService.GetActiveWalkersCountAsync(ct);
        return Ok(new { activeWalkersInBobruisk = count });
    }

    [HttpGet("poi")]
    public async Task<IActionResult> GetPointsOfInterest(CancellationToken ct)
    {
        var pois = await _dbContext.PointsOfInterest
            .AsNoTracking()
            .Select(p => new PointOfInterestDto(
                p.Id,
                p.Title,
                p.Category,
                p.DiscountDescription,
                p.HasDiscount,
                p.Latitude,
                p.Longitude,
                p.CreatedAt
            ))
            .ToListAsync(ct);

        return Ok(pois);
    }
}
