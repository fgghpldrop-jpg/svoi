using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Svoi.Application.Common.Interfaces;
using Svoi.Infrastructure.BackgroundWorkers;
using Svoi.Infrastructure.Data;
using Svoi.Infrastructure.Services;

namespace Svoi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? "Host=localhost;Port=5432;Database=svoi_db;Username=postgres;Password=postgres";

        services.AddDbContext<SvoiDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<ISvoiDbContext>(provider => provider.GetRequiredService<SvoiDbContext>());

        // HTTP Client
        services.AddHttpClient();

        // Core Domain & Application Services
        services.AddScoped<IH3GeoService, H3GeoService>();
        services.AddScoped<IClanStreakService, ClanStreakService>();
        services.AddScoped<ITelegramAuthService, TelegramAuthService>();
        services.AddScoped<ILlmBioGeneratorService, LlmBioGeneratorService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // Background Workers
        services.AddHostedService<HeatmapRecalculationWorker>();
        services.AddHostedService<ClanStreakValidationWorker>();

        // JWT Authentication Configuration
        var jwtSecret = configuration["Jwt:Secret"] ?? "Svoi_Bobruisk_Hyperlocal_Network_Super_Secret_Key_2026_Min_32_Chars!";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "Svoi.Api";
        var jwtAudience = configuration["Jwt:Audience"] ?? "Svoi.App";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ClockSkew = TimeSpan.Zero
            };

            // SignalR token support in query string
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    {
                        context.Token = accessToken;
                    }
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();

        return services;
    }
}
