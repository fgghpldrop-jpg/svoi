using System;
using System.Collections.Generic;

namespace Svoi.Domain.Entities;

public class Chat
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public bool IsClanChat { get; set; } = false;
    public Guid? ClanId { get; set; }
    public Clan? Clan { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
