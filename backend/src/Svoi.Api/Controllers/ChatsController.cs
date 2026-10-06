using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;
using Svoi.Domain.Entities;

namespace Svoi.Api.Controllers;

[ApiController]
[Route("api/v1/chats")]
[Authorize]
public class ChatsController : ControllerBase
{
    private readonly ISvoiDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;

    public ChatsController(ISvoiDbContext dbContext, ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyChats(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        // BUG FIX: Replaced in-memory LINQ processing after ToListAsync()
        // with a single efficient SQL projection.
        // Previous code loaded all chat participants and messages into RAM,
        // computed last message and title in C# — broken at scale.
        var chats = await _dbContext.ChatParticipants
            .Where(cp => cp.UserId == userId.Value)
            .Select(cp => new ChatDto(
                cp.Chat.Id,
                cp.Chat.IsClanChat,
                cp.Chat.ClanId,
                // Title: clan name for clan chats, or the other participant's name for DMs
                cp.Chat.IsClanChat
                    ? "Клан: " + (cp.Chat.Clan != null ? cp.Chat.Clan.Title : "Без названия")
                    : cp.Chat.Participants
                        .Where(p => p.UserId != userId.Value)
                        .Select(p => p.User.FirstName)
                        .FirstOrDefault() ?? "Личный диалог",
                // Last message text — computed in SQL via subquery
                cp.Chat.Messages
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => m.TextContent)
                    .FirstOrDefault(),
                // Last message timestamp
                cp.Chat.Messages
                    .OrderByDescending(m => m.SentAt)
                    .Select(m => (DateTimeOffset?)m.SentAt)
                    .FirstOrDefault(),
                // Unread count (messages after the user last joined; simplified to total for now)
                0
            ))
            .OrderByDescending(c => c.LastMessageTime)
            .ToListAsync(ct);

        return Ok(chats);
    }

    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(
        Guid id,
        [FromQuery] int limit = 50,
        [FromQuery] Guid? beforeId = null,
        CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        // Security: verify the caller is a participant of this chat
        var isParticipant = await _dbContext.ChatParticipants
            .AnyAsync(p => p.ChatId == id && p.UserId == userId.Value, ct);

        if (!isParticipant)
            return Forbid();

        limit = Math.Clamp(limit, 1, 200);

        IQueryable<Message> query = _dbContext.Messages.Where(m => m.ChatId == id);

        // Cursor-based pagination: fetch messages before a given messageId
        if (beforeId.HasValue)
        {
            var pivotTime = await _dbContext.Messages
                .Where(m => m.Id == beforeId.Value)
                .Select(m => (DateTimeOffset?)m.SentAt)
                .FirstOrDefaultAsync(ct);

            if (pivotTime.HasValue)
                query = query.Where(m => m.SentAt < pivotTime.Value);
        }

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(limit)
            .Select(m => new MessageDto(
                m.Id,
                m.ChatId,
                m.SenderId,
                m.Sender.FirstName,
                m.Sender.AvatarUrl,
                m.TextContent,
                m.SentAt
            ))
            .ToListAsync(ct);

        // Return in ascending order (oldest first for display)
        messages.Reverse();
        return Ok(messages);
    }

    /// <summary>
    /// Открывает одноразовый фильтр-чат между лидером клана и кандидатом
    /// для знакомства до одобрения заявки.
    /// </summary>
    [HttpPost("candidate-filter-chat")]
    public async Task<IActionResult> OpenCandidateFilterChat(
        [FromBody] OpenFilterChatDto dto,
        CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        // Only the clan leader can initiate a filter chat
        var clan = await _dbContext.Clans
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == dto.ClanId, ct);

        if (clan == null) return NotFound(new { error = "Клан не найден" });
        if (clan.LeaderId != userId.Value)
            return Forbid();

        // Verify there's an active pending request from this candidate
        var hasPendingRequest = await _dbContext.ClanJoinRequests
            .AnyAsync(r => r.ClanId == dto.ClanId
                        && r.UserId == dto.CandidateUserId
                        && r.Status == ClanJoinRequestStatus.Pending, ct);

        if (!hasPendingRequest)
            return BadRequest(new { error = "Активная заявка от этого пользователя не найдена" });

        // Check if a 1-on-1 chat between leader and candidate already exists
        // (using a join on ChatParticipant to find shared non-clan chats)
        var existingChatId = await _dbContext.ChatParticipants
            .Where(cp => cp.UserId == userId.Value && !cp.Chat.IsClanChat)
            .Select(cp => cp.ChatId)
            .Intersect(
                _dbContext.ChatParticipants
                    .Where(cp => cp.UserId == dto.CandidateUserId && !cp.Chat.IsClanChat)
                    .Select(cp => cp.ChatId)
            )
            .FirstOrDefaultAsync(ct);

        if (existingChatId != Guid.Empty)
            return Ok(new { chatId = existingChatId, message = "Фильтр-чат уже существует" });

        var newChat = new Chat
        {
            IsClanChat = false,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _dbContext.Chats.Add(newChat);

        _dbContext.ChatParticipants.Add(new ChatParticipant
        {
            ChatId = newChat.Id,
            UserId = userId.Value
        });
        _dbContext.ChatParticipants.Add(new ChatParticipant
        {
            ChatId = newChat.Id,
            UserId = dto.CandidateUserId
        });

        await _dbContext.SaveChangesAsync(ct);

        return Ok(new { chatId = newChat.Id, message = "Фильтр-чат успешно открыт" });
    }
}
