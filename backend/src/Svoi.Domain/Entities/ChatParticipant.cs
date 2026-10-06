using System;

namespace Svoi.Domain.Entities;

public class ChatParticipant
{
    public Guid ChatId { get; set; }
    public Chat Chat { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}
