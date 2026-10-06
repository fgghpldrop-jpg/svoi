using System;

namespace Svoi.Domain.Entities;

public static class ClanJoinRequestStatus
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
}

public class ClanJoinRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ClanId { get; set; }
    public Clan Clan { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Status { get; set; } = ClanJoinRequestStatus.Pending;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
