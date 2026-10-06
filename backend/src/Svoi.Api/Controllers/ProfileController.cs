using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;

namespace Svoi.Api.Controllers;

[ApiController]
[Route("api/v1/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly ISvoiDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;
    private readonly ILlmBioGeneratorService _llmService;

    public ProfileController(
        ISvoiDbContext dbContext,
        ICurrentUserService currentUser,
        ILlmBioGeneratorService llmService)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
        _llmService = llmService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId.Value, ct);

        if (user == null) return NotFound(new { error = "Пользователь не найден" });

        return Ok(new UserDto(
            user.Id,
            user.PhoneNumber,
            user.TelegramChatId,
            user.FirstName,
            user.BirthDate,
            user.Bio,
            user.AvatarUrl,
            user.VerificationVideoUrl,
            user.IsVerified,
            user.InstitutionName,
            user.PointsBalance,
            user.StatusIsWalking,
            user.StatusExpiresAt,
            user.IsIncognito,
            user.LastKnownH3Index,
            user.CreatedAt
        ));
    }

    [HttpPut("status")]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateUserStatusDto dto, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });

        user.StatusIsWalking = dto.StatusIsWalking;

        if (dto.StatusIsWalking)
        {
            // Clamp duration: min 15 min, max 480 min (8h), default 120 min
            int minutes = Math.Clamp(dto.DurationMinutes.GetValueOrDefault(120), 15, 480);
            user.StatusExpiresAt = DateTimeOffset.UtcNow.AddMinutes(minutes);
        }
        else
        {
            user.StatusExpiresAt = null;
        }

        if (dto.IsIncognito.HasValue)
        {
            user.IsIncognito = dto.IsIncognito.Value;
        }

        await _dbContext.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "Статус успешно обновлен",
            statusIsWalking = user.StatusIsWalking,
            statusExpiresAt = user.StatusExpiresAt,
            isIncognito = user.IsIncognito
        });
    }

    [HttpPost("ai-bio")]
    public async Task<IActionResult> GenerateAiBio([FromBody] AiBioRequestDto request, CancellationToken ct)
    {
        if (request.Tags == null || request.Tags.Count == 0)
            return BadRequest(new { error = "Укажите хотя бы один тег интересов" });

        var bio = await _llmService.GenerateBioAsync(request, ct);
        return Ok(new AiBioResponseDto(bio));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto dto, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
        if (user == null) return NotFound(new { error = "Пользователь не найден" });

        if (!string.IsNullOrWhiteSpace(dto.FirstName))
        {
            if (dto.FirstName.Length > 50)
                return BadRequest(new { error = "Имя не может быть длиннее 50 символов" });
            user.FirstName = dto.FirstName.Trim();
        }

        if (dto.Bio != null) user.Bio = dto.Bio;
        if (dto.AvatarUrl != null) user.AvatarUrl = dto.AvatarUrl;
        if (dto.InstitutionName != null) user.InstitutionName = dto.InstitutionName;

        // SECURITY FIX: VerificationVideoUrl сохраняется для модерации,
        // но IsVerified НЕ выставляется автоматически — только вручную модератором.
        // Самоверификация через URL — это дыра; оставляем флаг как есть.
        if (dto.VerificationVideoUrl != null)
        {
            user.VerificationVideoUrl = dto.VerificationVideoUrl;
            // IsVerified остаётся прежним — не трогаем!
        }

        await _dbContext.SaveChangesAsync(ct);

        return Ok(new { message = "Профиль успешно сохранен" });
    }
}
