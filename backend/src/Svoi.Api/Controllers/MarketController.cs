using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;

namespace Svoi.Api.Controllers;

[ApiController]
[Route("api/v1/market")]
[Authorize]
public class MarketController : ControllerBase
{
    private readonly ISvoiDbContext _dbContext;
    private readonly IClanStreakService _streakService;
    private readonly ICurrentUserService _currentUser;

    public MarketController(
        ISvoiDbContext dbContext,
        IClanStreakService streakService,
        ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _streakService = streakService;
        _currentUser = currentUser;
    }

    [HttpGet("promocodes")]
    public async Task<IActionResult> GetPromocodes(CancellationToken ct)
    {
        var promos = await _dbContext.PartnerPromocodes
            .AsNoTracking()
            .Include(p => p.PointOfInterest)
            .Select(p => new PartnerPromocodeDto(
                p.Id,
                p.PoiId,
                p.PointOfInterest != null ? p.PointOfInterest.Title : null,
                p.Title,
                p.CostInPoints,
                p.PromoCode,
                p.IsRedeemed
            ))
            .ToListAsync(ct);

        return Ok(promos);
    }

    [HttpPost("buy-shield")]
    public async Task<IActionResult> BuyShield([FromBody] BuyShieldRequestDto dto, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var result = await _streakService.BuyShieldAsync(userId.Value, dto.ClanId, ct);
        if (!result.Success)
        {
            return BadRequest(new { error = result.Message });
        }

        return Ok(result);
    }

    [HttpPost("redeem/{id}")]
    public async Task<IActionResult> RedeemCoupon(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var promo = await _dbContext.PartnerPromocodes.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (promo == null) return NotFound(new { error = "Промокод не найден" });
        if (promo.IsRedeemed) return BadRequest(new { error = "Промокод уже был использован" });

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (user == null) return NotFound();

        if (user.PointsBalance < promo.CostInPoints)
        {
            return BadRequest(new { error = $"Недостаточно очков. Требуется {promo.CostInPoints}, у вас {user.PointsBalance}" });
        }

        user.PointsBalance -= promo.CostInPoints;
        promo.IsRedeemed = true;

        await _dbContext.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "Купон успешно активирован!",
            code = promo.PromoCode,
            pointsBalance = user.PointsBalance
        });
    }
}



