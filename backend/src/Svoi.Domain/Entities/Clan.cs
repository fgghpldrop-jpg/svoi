using System;
using System.Collections.Generic;

namespace Svoi.Domain.Entities;

public class Clan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LeaderId { get; set; }
    public User Leader { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Tag { get; set; } = string.Empty;
    public int MaxMembers { get; set; } = 10;
    public int CurrentStreak { get; set; } = 0;
    public DateTimeOffset? StreakExpiresAt { get; set; }
    public bool IsOpenForJoin { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation collections
    public ICollection<ClanMember> Members { get; set; } = new List<ClanMember>();
    public ICollection<ClanJoinRequest> JoinRequests { get; set; } = new List<ClanJoinRequest>();
    public Chat? ClanChat { get; set; }
}
