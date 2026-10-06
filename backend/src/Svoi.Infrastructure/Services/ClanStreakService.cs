using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Svoi.Application.Common.Interfaces;
using Svoi.Application.DTOs;
using Svoi.Domain.Entities;

namespace Svoi.Infrastructure.Services;

public class ClanStreakService : IClanStreakService
{
    private readonly ISvoiDbContext _dbContext;
    private readonly ILogger<ClanStreakService> _logger;

    // Ephemeral in-memory storage: strictly not stored in permanent DB tables!
    private static readonly ConcurrentDictionary<Guid, LocationSample> _recentSamples = new();
    private static readonly ConcurrentDictionary<Guid, MeetSession> _activeSessions = new();

    private class LocationSample
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTimeOffset Timestamp { get; set; }
    }

    private class MeetSession
    {
        public DateTimeOffset StartTime { get; set; }
        public DateTimeOffset LastVerifiedTime { get; set; }
        public HashSet<Guid> ParticipantIds { get; set; } = new();

        /// <summary>
        /// ISO year+week key (e.g. "2026-W39") for the week when the streak was awarded.
        /// When a new week starts, this no longer matches the current week → session resets.
        /// BUG FIX: Previously IsCompletedForThisWeek was never cleared, permanently
        /// blocking a clan from earning additional streaks in the same process lifetime.
        /// </summary>
        public string? CompletedForWeek { get; set; }

        public bool IsCompletedForCurrentWeek()
        {
            if (CompletedForWeek == null) return false;
            var now = DateTimeOffset.UtcNow;
            var weekOfYear = System.Globalization.ISOWeek.GetWeekOfYear(now.DateTime);
            var currentWeekKey = $"{now.Year}-W{weekOfYear:D2}";
            return CompletedForWeek == currentWeekKey;
        }

        public void MarkCompletedForCurrentWeek()
        {
            var now = DateTimeOffset.UtcNow;
            var weekOfYear = System.Globalization.ISOWeek.GetWeekOfYear(now.DateTime);
            CompletedForWeek = $"{now.Year}-W{weekOfYear:D2}";
        }
    }


    public ClanStreakService(ISvoiDbContext dbContext, ILogger<ClanStreakService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public int CalculateQuorum(int memberCount)
    {
        if (memberCount <= 0) return 0;
        int quorum = (int)Math.Ceiling(memberCount * 0.6);
        return Math.Max(2, quorum);
    }

    public Task RecordUserLocationSampleAsync(Guid userId, double latitude, double longitude, CancellationToken ct = default)
    {
        _recentSamples[userId] = new LocationSample
        {
            Latitude = latitude,
            Longitude = longitude,
            Timestamp = DateTimeOffset.UtcNow
        };
        return Task.CompletedTask;
    }

    public async Task ProcessClanStreakValidationAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var staleThreshold = now.AddMinutes(-5);

        // Remove stale ephemeral samples (> 5 mins old)
        foreach (var kvp in _recentSamples)
        {
            if (kvp.Value.Timestamp < staleThreshold)
            {
                _recentSamples.TryRemove(kvp.Key, out _);
            }
        }

        // Fetch all active clans and their members
        var clans = await _dbContext.Clans
            .Include(c => c.Members)
            .AsNoTracking()
            .ToListAsync(ct);

        foreach (var clan in clans)
        {
            int totalMembers = clan.Members.Count;
            if (totalMembers < 2) continue;

            int requiredQuorum = CalculateQuorum(totalMembers);
            var memberIds = clan.Members.Select(m => m.UserId).ToList();

            // Find members with recent location samples
            var activeMemberSamples = memberIds
                .Where(id => _recentSamples.ContainsKey(id))
                .Select(id => new { UserId = id, Sample = _recentSamples[id] })
                .ToList();

            if (activeMemberSamples.Count < requiredQuorum)
            {
                // Quorum not met currently; reset session if inactive for > 10 minutes
                if (_activeSessions.TryGetValue(clan.Id, out var sess) &&
                    (now - sess.LastVerifiedTime).TotalMinutes > 10)
                {
                    _activeSessions.TryRemove(clan.Id, out _);
                }
                continue;
            }

            // Check if there is a subset of size >= requiredQuorum within 30m of each other
            var cluster = FindClusteredMembers(activeMemberSamples.Select(s => (s.UserId, s.Sample.Latitude, s.Sample.Longitude)).ToList(), 30.0);

            if (cluster.Count >= requiredQuorum)
            {
                var session = _activeSessions.GetOrAdd(clan.Id, _ => new MeetSession
                {
                    StartTime = now,
                    LastVerifiedTime = now,
                    ParticipantIds = new HashSet<Guid>(cluster)
                });

                // Already completed a meet this calendar week — skip until next week
                if (session.IsCompletedForCurrentWeek())
                {
                    continue;
                }

                session.LastVerifiedTime = now;
                foreach (var id in cluster)
                {
                    session.ParticipantIds.Add(id);
                }

                var duration = now - session.StartTime;
                _logger.LogInformation(
                    "Clan {ClanTitle} meet in progress: {Duration} min, {ParticipantsCount} participants (Quorum: {Quorum})",
                    clan.Title, Math.Round(duration.TotalMinutes, 1), session.ParticipantIds.Count, requiredQuorum);

                // Meet duration must be >= 30 minutes continuous
                if (duration.TotalMinutes >= 30)
                {
                    await CompleteMeetStreakAsync(clan.Id, session.ParticipantIds.ToList(), ct);
                    session.MarkCompletedForCurrentWeek();
                }
            }

            else
            {
                if (_activeSessions.TryGetValue(clan.Id, out var sess) &&
                    (now - sess.LastVerifiedTime).TotalMinutes > 5)
                {
                    // Cluster broken for more than 5 minutes: reset meet progress
                    _activeSessions.TryRemove(clan.Id, out _);
                }
            }
        }
    }

    private async Task CompleteMeetStreakAsync(Guid clanId, List<Guid> participantIds, CancellationToken ct)
    {
        var clan = await _dbContext.Clans.FirstOrDefaultAsync(c => c.Id == clanId, ct);
        if (clan == null) return;

        var now = DateTimeOffset.UtcNow;
        clan.CurrentStreak += 1;
        clan.StreakExpiresAt = now.AddDays(7);

        // Award +50 bonus points to each present member
        var participants = await _dbContext.Users
            .Where(u => participantIds.Contains(u.Id))
            .ToListAsync(ct);

        foreach (var user in participants)
        {
            user.PointsBalance += 50;
        }

        await _dbContext.SaveChangesAsync(ct);
        _logger.LogInformation(
            "Streak awarded to clan {ClanTitle}! New streak: {Streak}. Awarded 50 points to {Count} participants.",
            clan.Title, clan.CurrentStreak, participants.Count);
    }

    public async Task<BuyShieldResultDto> BuyShieldAsync(Guid userId, Guid clanId, CancellationToken ct = default)
    {
        const int shieldCost = 100;
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user == null)
            return new BuyShieldResultDto(false, "Пользователь не найден", 0, null);

        if (user.PointsBalance < shieldCost)
            return new BuyShieldResultDto(false,
                $"Недостаточно очков. Требуется {shieldCost}, у вас {user.PointsBalance}",
                user.PointsBalance, null);

        var clan = await _dbContext.Clans.FirstOrDefaultAsync(c => c.Id == clanId, ct);
        if (clan == null)
            return new BuyShieldResultDto(false, "Клан не найден", user.PointsBalance, null);

        var isMember = await _dbContext.ClanMembers
            .AnyAsync(cm => cm.ClanId == clanId && cm.UserId == userId, ct);

        if (!isMember)
            return new BuyShieldResultDto(false,
                "Вы не являетесь участником этого клана", user.PointsBalance, null);

        user.PointsBalance -= shieldCost;
        var baseDate = clan.StreakExpiresAt.HasValue && clan.StreakExpiresAt.Value > DateTimeOffset.UtcNow
            ? clan.StreakExpiresAt.Value
            : DateTimeOffset.UtcNow;

        clan.StreakExpiresAt = baseDate.AddDays(7);
        await _dbContext.SaveChangesAsync(ct);

        return new BuyShieldResultDto(
            true,
            "Щит успешно активирован! Стрик клана продлен на 7 дней.",
            user.PointsBalance,
            clan.StreakExpiresAt);
    }

    /// <summary>
    /// Находит наибольшую группу участников, в которой КАЖДАЯ пара
    /// находится на расстоянии ≤ maxDistanceMeters друг от друга (максимальная клика).
    /// 
    /// Алгоритм: перебор всех подмножеств.
    /// При N ≤ 15 (максимум участников в клане по ТЗ) — O(2^15 = 32768) — мгновенно.
    /// 
    /// BUG FIX: Предыдущий алгоритм находил точку с максимальным числом соседей,
    /// но не проверял взаимную близость всех участников в кластере.
    /// Пример ошибки: A←30m→B←30m→C, но A↔C = 55m > 30m.
    /// Старый код добавлял всех троих в кластер — неверно.
    /// Новый код проверяет каждую пару — только [A,B] и [B,C] как отдельные клики.
    /// </summary>
    private static List<Guid> FindClusteredMembers(
        List<(Guid UserId, double Lat, double Lon)> points,
        double maxDistanceMeters)
    {
        int n = points.Count;
        if (n == 0) return [];
        if (n == 1) return [points[0].UserId];

        // Build adjacency matrix: adj[i,j] = true iff distance(i,j) <= maxDistanceMeters
        bool[,] adj = new bool[n, n];
        for (int i = 0; i < n; i++)
        {
            adj[i, i] = true;
            for (int j = i + 1; j < n; j++)
            {
                double dist = Haversine(points[i].Lat, points[i].Lon, points[j].Lat, points[j].Lon);
                adj[i, j] = adj[j, i] = dist <= maxDistanceMeters;
            }
        }

        // Find maximum clique via bitmask enumeration (n ≤ 15 by TZ, so 2^15 = 32768)
        int bestMask = 0;
        int bestCount = 0;

        for (int mask = 1; mask < (1 << n); mask++)
        {
            // Collect indices in this subset
            bool isClique = true;
            int count = 0;

            for (int i = 0; i < n && isClique; i++)
            {
                if ((mask & (1 << i)) == 0) continue;
                count++;
                // Verify this node is adjacent to every other node in the mask
                for (int j = i + 1; j < n && isClique; j++)
                {
                    if ((mask & (1 << j)) == 0) continue;
                    if (!adj[i, j]) isClique = false;
                }
            }

            if (isClique && count > bestCount)
            {
                bestCount = count;
                bestMask = mask;
            }
        }

        var result = new List<Guid>(bestCount);
        for (int i = 0; i < n; i++)
        {
            if ((bestMask & (1 << i)) != 0)
                result.Add(points[i].UserId);
        }
        return result;
    }

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000.0;
        double dLat = (lat2 - lat1) * Math.PI / 180.0;
        double dLon = (lon2 - lon1) * Math.PI / 180.0;
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }
}

