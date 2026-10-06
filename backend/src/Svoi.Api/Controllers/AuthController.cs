using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;

namespace Svoi.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly ITelegramAuthService _authService;
    private readonly IJwtTokenService _jwtService;
    private readonly ISvoiDbContext _dbContext;

    public AuthController(
        ITelegramAuthService authService,
        IJwtTokenService jwtService,
        ISvoiDbContext dbContext)
    {
        _authService = authService;
        _jwtService = jwtService;
        _dbContext = dbContext;
    }

    [HttpPost("request-code")]
    public async Task<IActionResult> RequestCode([FromBody] RequestOtpDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            return BadRequest(new { error = "Укажите номер телефона" });
        }

        var success = await _authService.RequestOtpCodeAsync(dto.PhoneNumber, dto.TelegramChatId, ct);
        if (!success)
        {
            return StatusCode(500, new { error = "Не удалось отправить код подтверждения" });
        }

        return Ok(new
        {
            message = "Код подтверждения успешно сгенерирован и отправлен в Telegram",
            phoneNumber = dto.PhoneNumber,
            telegramChatId = dto.TelegramChatId
        });
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerifyCode([FromBody] VerifyOtpDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(new { error = "Номер телефона и код обязательны для заполнения" });
        }

        var (success, error, userId, isNewUser) = await _authService.VerifyOtpCodeAsync(dto.PhoneNumber, dto.Code, ct);
        if (!success || !userId.HasValue)
        {
            return BadRequest(new { error = error ?? "Неверный или устаревший код" });
        }

        var user = await _dbContext.Users.FirstAsync(u => u.Id == userId.Value, ct);
        var token = _jwtService.GenerateToken(user.Id, user.PhoneNumber, user.FirstName);

        var userDto = new UserDto(
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
        );

        return Ok(new AuthResponseDto(token, userDto, isNewUser));
    }
}
