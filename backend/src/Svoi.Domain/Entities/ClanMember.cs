using System;

namespace Svoi.Domain.Entities;

public class ClanMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClanId { get; set; }
    public Clan Clan { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;
}
