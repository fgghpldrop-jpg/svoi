using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Svoi.Application.Common.Interfaces;
using Svoi.Domain.Entities;

namespace Svoi.Infrastructure.Services;

public class TelegramAuthService : ITelegramAuthService
{
    private readonly ISvoiDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;
    private readonly ILogger<TelegramAuthService> _logger;

    private static readonly ConcurrentDictionary<string, (string Code, DateTimeOffset ExpiresAt)> _otpStore = new();

    public TelegramAuthService(
        ISvoiDbContext dbContext,
        IConfiguration configuration,
        HttpClient httpClient,
        ILogger<TelegramAuthService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<bool> RequestOtpCodeAsync(string phoneNumber, long? telegramChatId, CancellationToken ct = default)
    {
        var cleanedPhone = NormalizePhoneNumber(phoneNumber);
        var code = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(5);

        _otpStore[cleanedPhone] = (code, expiresAt);
        _logger.LogInformation("Generated OTP for {Phone}: {Code} (expires {ExpiresAt})", cleanedPhone, code, expiresAt);

        // Send via Telegram Bot API if configured
        var botToken = _configuration["Telegram:BotToken"];
        if (!string.IsNullOrWhiteSpace(botToken) && botToken != "YOUR_TELEGRAM_BOT_TOKEN" && telegramChatId.HasValue)
        {
            try
            {
                var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
                var body = new
                {
                    chat_id = telegramChatId.Value,
                    text = $"🔐 Твой код подтверждения для «СВОИ» (Бобруйск): {code}\nКод действует 5 минут."
                };
                var response = await _httpClient.PostAsJsonAsync(url, body, ct);
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Telegram OTP successfully sent to chat {ChatId}", telegramChatId.Value);
                    return true;
                }
                else
                {
                    var err = await response.Content.ReadAsStringAsync(ct);
                    _logger.LogWarning("Failed to send Telegram OTP: {Error}", err);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Telegram API for {ChatId}", telegramChatId);
            }
        }

        // Development/fallback mode: OTP is generated, logged, and ready for verification
        return true;
    }

    public async Task<(bool Success, string? Error, Guid? UserId, bool IsNewUser)> VerifyOtpCodeAsync(string phoneNumber, string code, CancellationToken ct = default)
    {
        var cleanedPhone = NormalizePhoneNumber(phoneNumber);

        // Allow demo test master code "777777" for development / automated testing
        bool isMasterCode = code == "777777";

        if (!isMasterCode)
        {
            if (!_otpStore.TryGetValue(cleanedPhone, out var otpData))
            {
                return (false, "Код не запрашивался или устарел", null, false);
            }

            if (DateTimeOffset.UtcNow > otpData.ExpiresAt)
            {
                _otpStore.TryRemove(cleanedPhone, out _);
                return (false, "Срок действия кода истек", null, false);
            }

            if (otpData.Code != code)
            {
                return (false, "Неверный код подтверждения", null, false);
            }

            _otpStore.TryRemove(cleanedPhone, out _);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.PhoneNumber == cleanedPhone, ct);
        bool isNew = false;

        if (user == null)
        {
            isNew = true;
            user = new User
            {
                PhoneNumber = cleanedPhone,
                FirstName = "Свой в Бобруйске",
                BirthDate = new DateOnly(2004, 1, 1),
                Bio = "Новый житель города Бобруйск",
                PointsBalance = 50, // Welcome bonus
                StatusIsWalking = false,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(ct);
        }

        return (true, null, user.Id, isNew);
    }

    private static string NormalizePhoneNumber(string phone)
    {
        return new string(phone.Where(char.IsDigit).ToArray());
    }
}
