using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Svoi.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "city_news",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    is_flash_event = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_city_news", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "h3_heatmap_cells",
                columns: table => new
                {
                    h3_index = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    user_count = table.Column<int>(type: "integer", nullable: false),
                    intensity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    calculated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    boundary_geojson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_h3_heatmap_cells", x => x.h3_index);
                });

            migrationBuilder.CreateTable(
                name: "points_of_interest",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    discount_description = table.Column<string>(type: "text", nullable: true),
                    has_discount = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    latitude = table.Column<double>(type: "double precision", nullable: false),
                    longitude = table.Column<double>(type: "double precision", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_points_of_interest", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    phone_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    telegram_chat_id = table.Column<long>(type: "bigint", nullable: true),
                    first_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    birth_date = table.Column<DateOnly>(type: "date", nullable: false),
                    bio = table.Column<string>(type: "text", nullable: true),
                    avatar_url = table.Column<string>(type: "text", nullable: true),
                    verification_video_url = table.Column<string>(type: "text", nullable: true),
                    is_verified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    institution_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    points_balance = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    status_is_walking = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    status_expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_incognito = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    last_known_h3_index = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "partner_promocodes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    poi_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    cost_in_points = table.Column<int>(type: "integer", nullable: false),
                    promo_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_redeemed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_partner_promocodes", x => x.id);
                    table.ForeignKey(
                        name: "FK_partner_promocodes_points_of_interest_poi_id",
                        column: x => x.poi_id,
                        principalTable: "points_of_interest",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "clans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    leader_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    tag = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    max_members = table.Column<int>(type: "integer", nullable: false, defaultValue: 10),
                    current_streak = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    streak_expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_open_for_join = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clans", x => x.id);
                    table.ForeignKey(
                        name: "FK_clans_users_leader_id",
                        column: x => x.leader_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "chats",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    is_clan_chat = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    clan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chats", x => x.id);
                    table.ForeignKey(
                        name: "FK_chats_clans_clan_id",
                        column: x => x.clan_id,
                        principalTable: "clans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "clan_join_requests",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    clan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clan_join_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_clan_join_requests_clans_clan_id",
                        column: x => x.clan_id,
                        principalTable: "clans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_clan_join_requests_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "clan_members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    clan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    joined_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clan_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_clan_members_clans_clan_id",
                        column: x => x.clan_id,
                        principalTable: "clans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_clan_members_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "chat_participants",
                columns: table => new
                {
                    chat_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_participants", x => new { x.chat_id, x.user_id });
                    table.ForeignKey(
                        name: "FK_chat_participants_chats_chat_id",
                        column: x => x.chat_id,
                        principalTable: "chats",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_chat_participants_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    chat_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_id = table.Column<Guid>(type: "uuid", nullable: false),
                    text_content = table.Column<string>(type: "text", nullable: false),
                    sent_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_messages", x => x.id);
                    table.ForeignKey(
                        name: "FK_messages_chats_chat_id",
                        column: x => x.chat_id,
                        principalTable: "chats",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_messages_users_sender_id",
                        column: x => x.sender_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_chat_participants_user_id",
                table: "chat_participants",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_chats_clan_id",
                table: "chats",
                column: "clan_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_clan_join_requests_clan_id",
                table: "clan_join_requests",
                column: "clan_id");

            migrationBuilder.CreateIndex(
                name: "IX_clan_join_requests_user_id",
                table: "clan_join_requests",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_clan_members_user_id",
                table: "clan_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "uq_clan_user",
                table: "clan_members",
                columns: new[] { "clan_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_clans_leader_id",
                table: "clans",
                column: "leader_id");

            migrationBuilder.CreateIndex(
                name: "idx_messages_chat_id",
                table: "messages",
                columns: new[] { "chat_id", "sent_at" });

            migrationBuilder.CreateIndex(
                name: "IX_messages_sender_id",
                table: "messages",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "IX_partner_promocodes_poi_id",
                table: "partner_promocodes",
                column: "poi_id");

            migrationBuilder.CreateIndex(
                name: "idx_poi_location",
                table: "points_of_interest",
                columns: new[] { "latitude", "longitude" });

            migrationBuilder.CreateIndex(
                name: "IX_users_phone_number",
                table: "users",
                column: "phone_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_telegram_chat_id",
                table: "users",
                column: "telegram_chat_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chat_participants");

            migrationBuilder.DropTable(
                name: "city_news");

            migrationBuilder.DropTable(
                name: "clan_join_requests");

            migrationBuilder.DropTable(
                name: "clan_members");

            migrationBuilder.DropTable(
                name: "h3_heatmap_cells");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "partner_promocodes");

            migrationBuilder.DropTable(
                name: "chats");

            migrationBuilder.DropTable(
                name: "points_of_interest");

            migrationBuilder.DropTable(
                name: "clans");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
