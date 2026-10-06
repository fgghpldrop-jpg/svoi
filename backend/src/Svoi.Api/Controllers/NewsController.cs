using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;

namespace Svoi.Api.Controllers;

[ApiController]
[Route("api/v1/news")]
public class NewsController : ControllerBase
{
    private readonly ISvoiDbContext _dbContext;

    public NewsController(ISvoiDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetNews(CancellationToken ct)
    {
        var news = await _dbContext.CityNews
            .AsNoTracking()
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new CityNewsDto(
                n.Id,
                n.Title,
                n.Content,
                n.ImageUrl,
                n.IsFlashEvent,
                n.ExpiresAt,
                n.CreatedAt
            ))
            .ToListAsync(ct);

        return Ok(news);
    }
}
