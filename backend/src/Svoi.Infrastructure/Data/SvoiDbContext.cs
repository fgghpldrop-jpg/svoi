using System;
using Microsoft.EntityFrameworkCore;
using Svoi.Application.Common.Interfaces;
using Svoi.Domain.Entities;

namespace Svoi.Infrastructure.Data;

public class SvoiDbContext : DbContext, ISvoiDbContext
{
    public SvoiDbContext(DbContextOptions<SvoiDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Clan> Clans => Set<Clan>();
    public DbSet<ClanMember> ClanMembers => Set<ClanMember>();
    public DbSet<ClanJoinRequest> ClanJoinRequests => Set<ClanJoinRequest>();
    public DbSet<PointOfInterest> PointsOfInterest => Set<PointOfInterest>();
    public DbSet<CityNews> CityNews => Set<CityNews>();
    public DbSet<Chat> Chats => Set<Chat>();
    public DbSet<ChatParticipant> ChatParticipants => Set<ChatParticipant>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<PartnerPromocode> PartnerPromocodes => Set<PartnerPromocode>();
    public DbSet<H3HeatmapCell> H3HeatmapCells => Set<H3HeatmapCell>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Users
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20).IsRequired();
            entity.HasIndex(e => e.PhoneNumber).IsUnique();
            entity.Property(e => e.TelegramChatId).HasColumnName("telegram_chat_id");
            entity.HasIndex(e => e.TelegramChatId).IsUnique();
            entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(50).IsRequired();
            entity.Property(e => e.BirthDate).HasColumnName("birth_date").HasColumnType("date").IsRequired();
            entity.Property(e => e.Bio).HasColumnName("bio");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(e => e.VerificationVideoUrl).HasColumnName("verification_video_url");
            entity.Property(e => e.IsVerified).HasColumnName("is_verified").HasDefaultValue(false);
            entity.Property(e => e.InstitutionName).HasColumnName("institution_name").HasMaxLength(100);
            entity.Property(e => e.PointsBalance).HasColumnName("points_balance").HasDefaultValue(0);
            entity.Property(e => e.StatusIsWalking).HasColumnName("status_is_walking").HasDefaultValue(false);
            entity.Property(e => e.StatusExpiresAt).HasColumnName("status_expires_at");
            entity.Property(e => e.IsIncognito).HasColumnName("is_incognito").HasDefaultValue(false);
            entity.Property(e => e.LastKnownH3Index).HasColumnName("last_known_h3_index").HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
        });

        // Clans
        modelBuilder.Entity<Clan>(entity =>
        {
            entity.ToTable("clans");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.LeaderId).HasColumnName("leader_id").IsRequired();
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Tag).HasColumnName("tag").HasMaxLength(30).IsRequired();
            entity.Property(e => e.MaxMembers).HasColumnName("max_members").HasDefaultValue(10);
            entity.Property(e => e.CurrentStreak).HasColumnName("current_streak").HasDefaultValue(0);
            entity.Property(e => e.StreakExpiresAt).HasColumnName("streak_expires_at");
            entity.Property(e => e.IsOpenForJoin).HasColumnName("is_open_for_join").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

            entity.HasOne(e => e.Leader)
                .WithMany(u => u.ClansLed)
                .HasForeignKey(e => e.LeaderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Clan Members
        modelBuilder.Entity<ClanMember>(entity =>
        {
            entity.ToTable("clan_members");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ClanId).HasColumnName("clan_id").IsRequired();
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.JoinedAt).HasColumnName("joined_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => new { e.ClanId, e.UserId })
                .IsUnique()
                .HasDatabaseName("uq_clan_user");

            entity.HasOne(e => e.Clan)
                .WithMany(c => c.Members)
                .HasForeignKey(e => e.ClanId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.ClanMemberships)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Clan Join Requests
        modelBuilder.Entity<ClanJoinRequest>(entity =>
        {
            entity.ToTable("clan_join_requests");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ClanId).HasColumnName("clan_id").IsRequired();
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("Pending");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

            entity.HasOne(e => e.Clan)
                .WithMany(c => c.JoinRequests)
                .HasForeignKey(e => e.ClanId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.ClanJoinRequests)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Points of Interest
        modelBuilder.Entity<PointOfInterest>(entity =>
        {
            entity.ToTable("points_of_interest");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(150).IsRequired();
            entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(50).IsRequired();
            entity.Property(e => e.DiscountDescription).HasColumnName("discount_description");
            entity.Property(e => e.HasDiscount).HasColumnName("has_discount").HasDefaultValue(false);
            entity.Property(e => e.Latitude).HasColumnName("latitude").IsRequired();
            entity.Property(e => e.Longitude).HasColumnName("longitude").IsRequired();
            entity.Ignore(e => e.Location);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => new { e.Latitude, e.Longitude })
                .HasDatabaseName("idx_poi_location");
        });

        // City News
        modelBuilder.Entity<CityNews>(entity =>
        {
            entity.ToTable("city_news");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
            entity.Property(e => e.Content).HasColumnName("content").IsRequired();
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.IsFlashEvent).HasColumnName("is_flash_event").HasDefaultValue(false);
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
        });

        // Chats
        modelBuilder.Entity<Chat>(entity =>
        {
            entity.ToTable("chats");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.IsClanChat).HasColumnName("is_clan_chat").HasDefaultValue(false);
            entity.Property(e => e.ClanId).HasColumnName("clan_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

            entity.HasOne(e => e.Clan)
                .WithOne(c => c.ClanChat)
                .HasForeignKey<Chat>(e => e.ClanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Chat Participants
        modelBuilder.Entity<ChatParticipant>(entity =>
        {
            entity.ToTable("chat_participants");
            entity.HasKey(e => new { e.ChatId, e.UserId });
            entity.Property(e => e.ChatId).HasColumnName("chat_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(e => e.Chat)
                .WithMany(c => c.Participants)
                .HasForeignKey(e => e.ChatId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.ChatParticipations)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Messages
        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.ChatId).HasColumnName("chat_id").IsRequired();
            entity.Property(e => e.SenderId).HasColumnName("sender_id").IsRequired();
            entity.Property(e => e.TextContent).HasColumnName("text_content").IsRequired();
            entity.Property(e => e.SentAt).HasColumnName("sent_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => new { e.ChatId, e.SentAt })
                .HasDatabaseName("idx_messages_chat_id");

            entity.HasOne(e => e.Chat)
                .WithMany(c => c.Messages)
                .HasForeignKey(e => e.ChatId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sender)
                .WithMany(u => u.Messages)
                .HasForeignKey(e => e.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Partner Promocodes
        modelBuilder.Entity<PartnerPromocode>(entity =>
        {
            entity.ToTable("partner_promocodes");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
            entity.Property(e => e.PoiId).HasColumnName("poi_id");
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(100).IsRequired();
            entity.Property(e => e.CostInPoints).HasColumnName("cost_in_points").IsRequired();
            entity.Property(e => e.PromoCode).HasColumnName("promo_code").HasMaxLength(50).IsRequired();
            entity.Property(e => e.IsRedeemed).HasColumnName("is_redeemed").HasDefaultValue(false);

            entity.HasOne(e => e.PointOfInterest)
                .WithMany(p => p.PartnerPromocodes)
                .HasForeignKey(e => e.PoiId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // H3 Heatmap Snapshot
        modelBuilder.Entity<H3HeatmapCell>(entity =>
        {
            entity.ToTable("h3_heatmap_cells");
            entity.HasKey(e => e.H3Index);
            entity.Property(e => e.H3Index).HasColumnName("h3_index").HasMaxLength(20);
            entity.Property(e => e.UserCount).HasColumnName("user_count").IsRequired();
            entity.Property(e => e.Intensity).HasColumnName("intensity").HasMaxLength(20).IsRequired();
            entity.Property(e => e.CalculatedAt).HasColumnName("calculated_at").IsRequired();
            entity.Property(e => e.BoundaryGeoJson).HasColumnName("boundary_geojson");
        });
    }
}
