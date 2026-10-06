using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Svoi.Domain.Entities;

namespace Svoi.Application.Common.Interfaces;

public interface ISvoiDbContext
{
    DbSet<User> Users { get; }
    DbSet<Clan> Clans { get; }
    DbSet<ClanMember> ClanMembers { get; }
    DbSet<ClanJoinRequest> ClanJoinRequests { get; }
    DbSet<PointOfInterest> PointsOfInterest { get; }
    DbSet<CityNews> CityNews { get; }
    DbSet<Chat> Chats { get; }
    DbSet<ChatParticipant> ChatParticipants { get; }
    DbSet<Message> Messages { get; }
    DbSet<PartnerPromocode> PartnerPromocodes { get; }
    DbSet<H3HeatmapCell> H3HeatmapCells { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
