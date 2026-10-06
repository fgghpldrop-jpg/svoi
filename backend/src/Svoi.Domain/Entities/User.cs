using System;
using System.Collections.Generic;

namespace Svoi.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string PhoneNumber { get; set; } = string.Empty;
    public long? TelegramChatId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public DateOnly BirthDate { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string? VerificationVideoUrl { get; set; }
    public bool IsVerified { get; set; } = false;
    public string? InstitutionName { get; set; }
    public int PointsBalance { get; set; } = 0;
    public bool StatusIsWalking { get; set; } = false;
    public DateTimeOffset? StatusExpiresAt { get; set; }
    public bool IsIncognito { get; set; } = false;
    public string? LastKnownH3Index { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation collections
    public ICollection<Clan> ClansLed { get; set; } = new List<Clan>();
    public ICollection<ClanMember> ClanMemberships { get; set; } = new List<ClanMember>();
    public ICollection<ClanJoinRequest> ClanJoinRequests { get; set; } = new List<ClanJoinRequest>();
    public ICollection<ChatParticipant> ChatParticipations { get; set; } = new List<ChatParticipant>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
