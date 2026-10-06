using System;
using System.Collections.Generic;

namespace Svoi.Application.DTOs;

public record RequestOtpDto(string PhoneNumber, long? TelegramChatId);

public record VerifyOtpDto(string PhoneNumber, string Code);

public record AuthResponseDto(
    string Token,
    UserDto User,
    bool IsNewUser
);

public record UserDto(
    Guid Id,
    string PhoneNumber,
    long? TelegramChatId,
    string FirstName,
    DateOnly BirthDate,
    string? Bio,
    string? AvatarUrl,
    string? VerificationVideoUrl,
    bool IsVerified,
    string? InstitutionName,
    int PointsBalance,
    bool StatusIsWalking,
    DateTimeOffset? StatusExpiresAt,
    bool IsIncognito,
    string? LastKnownH3Index,
    DateTimeOffset CreatedAt
);

public record UpdateUserStatusDto(
    bool StatusIsWalking,
    int? DurationMinutes,
    bool? IsIncognito
);

public record AiBioRequestDto(
    string Personality, // "дерзкий", "дружелюбный", "краткий", "ироничный"
    List<string> Tags, // #спорт, #кино, #прогулка, #кафе, #игры
    string? Hobbies,
    string? FavoriteSpotsInBobruisk,
    string? MusicOrVibe
);

public record AiBioResponseDto(string Bio);

public record GeoPingDto(
    double Latitude,
    double Longitude,
    double? AccuracyMeters,
    string? ActivityType // "Walking", "Still", etc.
);

public record HeatmapPolygonDto(
    string H3Index,
    int UserCount,
    string Intensity, // "Green", "Orange", "Red"
    List<List<double>> Coordinates // [[lng, lat], ...]
);

public record PointOfInterestDto(
    Guid Id,
    string Title,
    string Category,
    string? DiscountDescription,
    bool HasDiscount,
    double Latitude,
    double Longitude,
    DateTimeOffset CreatedAt
);

public record CityNewsDto(
    Guid Id,
    string Title,
    string Content,
    string? ImageUrl,
    bool IsFlashEvent,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset CreatedAt
);

public record CreateClanDto(
    string Title,
    string Description,
    string Tag,
    int MaxMembers,
    double? MeetingPointLat,
    double? MeetingPointLng
);

public record ClanDto(
    Guid Id,
    Guid LeaderId,
    string LeaderName,
    string Title,
    string? Description,
    string Tag,
    int MaxMembers,
    int MemberCount,
    int CurrentStreak,
    DateTimeOffset? StreakExpiresAt,
    bool IsOpenForJoin,
    DateTimeOffset CreatedAt,
    bool IsCurrentUserMember,
    bool IsCurrentUserLeader
);

public record ClanJoinRequestDto(
    Guid Id,
    Guid ClanId,
    string ClanTitle,
    Guid UserId,
    string UserName,
    string? UserAvatarUrl,
    bool UserIsVerified,
    string Status,
    DateTimeOffset CreatedAt
);

public record ModerateClanRequestDto(
    Guid RequestId,
    bool Approve
);

public record ChatDto(
    Guid Id,
    bool IsClanChat,
    Guid? ClanId,
    string? Title,
    string? LastMessage,
    DateTimeOffset? LastMessageTime,
    int UnreadCount
);

public record MessageDto(
    Guid Id,
    Guid ChatId,
    Guid SenderId,
    string SenderName,
    string? SenderAvatarUrl,
    string TextContent,
    DateTimeOffset SentAt
);

public record SendMessageDto(
    Guid ChatId,
    string TextContent
);

public record PartnerPromocodeDto(
    Guid Id,
    Guid? PoiId,
    string? PoiTitle,
    string Title,
    int CostInPoints,
    string PromoCode,
    bool IsRedeemed
);

public record BuyShieldResultDto(
    bool Success,
    string Message,
    int NewPointsBalance,
    DateTimeOffset? NewStreakExpiresAt
);

// ──────────────────────────────────────────────────────────────────────────
// DTOs that were previously (incorrectly) declared inside API controllers.
// Moved here to enforce Clean Architecture layering.
// ──────────────────────────────────────────────────────────────────────────

public record UpdateProfileRequestDto(
    string? FirstName,
    string? Bio,
    string? AvatarUrl,
    /// <summary>
    /// Url видео-верификации. Флаг IsVerified устанавливается модератором,
    /// а НЕ автоматически при наличии URL — это устраняет дыру безопасности.
    /// </summary>
    string? VerificationVideoUrl,
    string? InstitutionName
);

public record BuyShieldRequestDto(Guid ClanId);

public record OpenFilterChatDto(Guid ClanId, Guid CandidateUserId);

/// <summary>DTO запроса гео-пинга с серверной валидацией координат.</summary>
public record GeoPingValidatedDto(
    double Latitude,
    double Longitude,
    double? AccuracyMeters,
    string? ActivityType
)
{
    /// <summary>Проверяет, что координаты находятся в допустимых пределах.</summary>
    public bool IsValid() =>
        Latitude is >= -90.0 and <= 90.0 &&
        Longitude is >= -180.0 and <= 180.0;
}
