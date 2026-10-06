using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;
using Svoi.Domain.Entities;

namespace Svoi.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly ISvoiDbContext _dbContext;

    public ChatHub(ISvoiDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task JoinChat(string chatId)
    {
        // Security: only allow joining groups the user is a participant of
        if (!Guid.TryParse(chatId, out var chatGuid)) return;

        var userId = GetUserId();
        if (!userId.HasValue) return;

        var isParticipant = await _dbContext.ChatParticipants
            .AnyAsync(p => p.ChatId == chatGuid && p.UserId == userId.Value);

        if (!isParticipant) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
    }

    public async Task LeaveChat(string chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
    }

    public async Task SendMessage(string chatIdStr, string textContent)
    {
        if (!Guid.TryParse(chatIdStr, out var chatId)) return;

        var userId = GetUserId();
        if (!userId.HasValue) return;

        if (string.IsNullOrWhiteSpace(textContent)) return;
        if (textContent.Length > 4096) return; // hard limit

        // SECURITY FIX: verify caller is a participant before writing to DB
        var isParticipant = await _dbContext.ChatParticipants
            .AnyAsync(p => p.ChatId == chatId && p.UserId == userId.Value);

        if (!isParticipant) return;

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null) return;

        var message = new Message
        {
            ChatId = chatId,
            SenderId = userId.Value,
            TextContent = textContent.Trim(),
            SentAt = DateTimeOffset.UtcNow
        };

        _dbContext.Messages.Add(message);
        await _dbContext.SaveChangesAsync();

        var messageDto = new MessageDto(
            message.Id,
            message.ChatId,
            message.SenderId,
            user.FirstName,
            user.AvatarUrl,
            message.TextContent,
            message.SentAt
        );

        await Clients.Group(chatIdStr).SendAsync("ReceiveMessage", messageDto);
    }

    private Guid? GetUserId()
    {
        var value = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? Context.User?.FindFirst("sub")?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }
}
