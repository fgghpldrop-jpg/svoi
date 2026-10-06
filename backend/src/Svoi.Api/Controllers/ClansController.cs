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
[Route("api/v1/clans")]
[Authorize]
public class ClansController : ControllerBase
{
    private readonly ISvoiDbContext _dbContext;
    private readonly ICurrentUserService _currentUser;

    public ClansController(ISvoiDbContext dbContext, ICurrentUserService currentUser)
    {
        _dbContext = dbContext;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<IActionResult> CreateClan([FromBody] CreateClanDto dto, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        // Strict limit: maximum 5 clans per user!
        var userClansCount = await _dbContext.ClanMembers.CountAsync(cm => cm.UserId == userId.Value, ct);
        if (userClansCount >= 5)
        {
            return BadRequest(new { error = "Достигнут системный лимит: нельзя состоять более чем в 5 кланах одновременно." });
        }

        // Validate member limits: from 3 to 15
        int maxMembers = Math.Clamp(dto.MaxMembers <= 0 ? 10 : dto.MaxMembers, 3, 15);

        var clan = new Clan
        {
            LeaderId = userId.Value,
            Title = dto.Title.Trim(),
            Description = dto.Description,
            Tag = dto.Tag.Trim().StartsWith('#') ? dto.Tag.Trim() : $"#{dto.Tag.Trim()}",
            MaxMembers = maxMembers,
            CurrentStreak = 0,
            StreakExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            IsOpenForJoin = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Clans.Add(clan);

        // Add creator as member
        var membership = new ClanMember
        {
            ClanId = clan.Id,
            UserId = userId.Value,
            JoinedAt = DateTimeOffset.UtcNow
        };
        _dbContext.ClanMembers.Add(membership);

        // Create dedicated clan chat
        var clanChat = new Chat
        {
            IsClanChat = true,
            ClanId = clan.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _dbContext.Chats.Add(clanChat);

        // Add leader as chat participant
        _dbContext.ChatParticipants.Add(new ChatParticipant
        {
            ChatId = clanChat.Id,
            UserId = userId.Value
        });

        await _dbContext.SaveChangesAsync(ct);

        return Ok(new
        {
            message = "Клан успешно создан",
            clanId = clan.Id,
            title = clan.Title,
            chatId = clanChat.Id
        });
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyClans(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        // Single query with proper projection — no double Select, no N+1
        var clans = await _dbContext.ClanMembers
            .Where(cm => cm.UserId == userId.Value)
            .Select(cm => new ClanDto(
                cm.Clan.Id,
                cm.Clan.LeaderId,
                cm.Clan.Leader.FirstName,
                cm.Clan.Title,
                cm.Clan.Description,
                cm.Clan.Tag,
                cm.Clan.MaxMembers,
                cm.Clan.Members.Count,
                cm.Clan.CurrentStreak,
                cm.Clan.StreakExpiresAt,
                cm.Clan.IsOpenForJoin,
                cm.Clan.CreatedAt,
                true,                             // current user is a member by definition
                cm.Clan.LeaderId == userId.Value  // is leader
            ))
            .ToListAsync(ct);

        return Ok(clans);
    }


    [HttpGet("discover")]
    public async Task<IActionResult> DiscoverClans(CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        var clans = await _dbContext.Clans
            .Where(c => c.IsOpenForJoin)
            .Include(c => c.Leader)
            .Include(c => c.Members)
            .OrderByDescending(c => c.CurrentStreak)
            .ThenByDescending(c => c.CreatedAt)
            .Select(c => new ClanDto(
                c.Id,
                c.LeaderId,
                c.Leader.FirstName,
                c.Title,
                c.Description,
                c.Tag,
                c.MaxMembers,
                c.Members.Count,
                c.CurrentStreak,
                c.StreakExpiresAt,
                c.IsOpenForJoin,
                c.CreatedAt,
                userId.HasValue && c.Members.Any(m => m.UserId == userId.Value),
                userId.HasValue && c.LeaderId == userId.Value
            ))
            .ToListAsync(ct);

        return Ok(clans);
    }

    [HttpPost("{id}/join-request")]
    public async Task<IActionResult> RequestToJoin(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var clan = await _dbContext.Clans
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

        if (clan == null) return NotFound(new { error = "Клан не найден" });

        if (clan.Members.Any(m => m.UserId == userId.Value))
        {
            return BadRequest(new { error = "Вы уже состоите в этом клане" });
        }

        if (clan.Members.Count >= clan.MaxMembers)
        {
            return BadRequest(new { error = "В клане достигнут лимит участников" });
        }

        var userClansCount = await _dbContext.ClanMembers.CountAsync(cm => cm.UserId == userId.Value, ct);
        if (userClansCount >= 5)
        {
            return BadRequest(new { error = "Вы не можете вступить более чем в 5 кланов" });
        }

        var existingRequest = await _dbContext.ClanJoinRequests
            .FirstOrDefaultAsync(r => r.ClanId == id && r.UserId == userId.Value && r.Status == ClanJoinRequestStatus.Pending, ct);

        if (existingRequest != null)
        {
            return BadRequest(new { error = "Ваша заявка уже на рассмотрении у лидера" });
        }

        var request = new ClanJoinRequest
        {
            ClanId = id,
            UserId = userId.Value,
            Status = ClanJoinRequestStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.ClanJoinRequests.Add(request);
        await _dbContext.SaveChangesAsync(ct);

        return Ok(new { message = "Заявка отправлена лидеру клана", requestId = request.Id });
    }

    [HttpGet("{id}/requests")]
    public async Task<IActionResult> GetClanRequests(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var clan = await _dbContext.Clans.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (clan == null) return NotFound(new { error = "Клан не найден" });

        if (clan.LeaderId != userId.Value)
        {
            return Forbid("Только лидер может просматривать заявки");
        }

        var requests = await _dbContext.ClanJoinRequests
            .Where(r => r.ClanId == id && r.Status == ClanJoinRequestStatus.Pending)
            .Include(r => r.User)
            .Include(r => r.Clan)
            .Select(r => new ClanJoinRequestDto(
                r.Id,
                r.ClanId,
                r.Clan.Title,
                r.UserId,
                r.User.FirstName,
                r.User.AvatarUrl,
                r.User.IsVerified,
                r.Status,
                r.CreatedAt
            ))
            .ToListAsync(ct);

        return Ok(requests);
    }

    [HttpPost("{id}/moderate")]
    public async Task<IActionResult> ModerateRequest(Guid id, [FromBody] ModerateClanRequestDto dto, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var clan = await _dbContext.Clans.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (clan == null) return NotFound(new { error = "Клан не найден" });

        if (clan.LeaderId != userId.Value)
        {
            return Forbid("Только лидер клана может модерировать заявки");
        }

        var request = await _dbContext.ClanJoinRequests
            .FirstOrDefaultAsync(r => r.Id == dto.RequestId && r.ClanId == id, ct);

        if (request == null) return NotFound(new { error = "Заявка не найдена" });

        if (dto.Approve)
        {
            request.Status = ClanJoinRequestStatus.Approved;

            var isAlreadyMember = await _dbContext.ClanMembers.AnyAsync(m => m.ClanId == id && m.UserId == request.UserId, ct);
            if (!isAlreadyMember)
            {
                _dbContext.ClanMembers.Add(new ClanMember
                {
                    ClanId = id,
                    UserId = request.UserId,
                    JoinedAt = DateTimeOffset.UtcNow
                });

                // Add to clan chat
                var clanChat = await _dbContext.Chats.FirstOrDefaultAsync(c => c.ClanId == id, ct);
                if (clanChat != null)
                {
                    var isChatParticipant = await _dbContext.ChatParticipants.AnyAsync(cp => cp.ChatId == clanChat.Id && cp.UserId == request.UserId, ct);
                    if (!isChatParticipant)
                    {
                        _dbContext.ChatParticipants.Add(new ChatParticipant
                        {
                            ChatId = clanChat.Id,
                            UserId = request.UserId
                        });
                    }
                }
            }
        }
        else
        {
            request.Status = ClanJoinRequestStatus.Rejected;
        }

        await _dbContext.SaveChangesAsync(ct);

        return Ok(new
        {
            message = dto.Approve ? "Заявка одобрена, пользователь добавлен в клан" : "Заявка отклонена",
            status = request.Status
        });
    }

    [HttpDelete("{id}/leave")]
    public async Task<IActionResult> LeaveClan(Guid id, CancellationToken ct)
    {
        var userId = _currentUser.UserId;
        if (!userId.HasValue) return Unauthorized();

        var clan = await _dbContext.Clans.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (clan == null) return NotFound(new { error = "Клан не найден" });

        if (clan.LeaderId == userId.Value)
        {
            return BadRequest(new { error = "Лидер не может покинуть клан без передачи лидерства или роспуска клана" });
        }

        var membership = await _dbContext.ClanMembers.FirstOrDefaultAsync(cm => cm.ClanId == id && cm.UserId == userId.Value, ct);
        if (membership == null) return BadRequest(new { error = "Вы не состоите в этом клане" });

        _dbContext.ClanMembers.Remove(membership);
        await _dbContext.SaveChangesAsync(ct);

        return Ok(new { message = "Вы покинули клан" });
    }
}
