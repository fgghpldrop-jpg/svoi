using System;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Svoi.Api.Hubs;
using Svoi.Api.Services;
using Svoi.Application.Common.Interfaces;
using Svoi.Infrastructure;
using Svoi.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Controllers & JSON configuration
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// Add Clean Architecture Infrastructure (EF Core, Services, Auth, Background Workers)
builder.Services.AddInfrastructure(builder.Configuration);

// Real-Time SignalR
builder.Services.AddSignalR();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Swagger with JWT Bearer definition
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "«СВОИ» Web API — Бобруйск",
        Version = "v1",
        Description = "Гиперлокальная социально-игровая сеть реального времени для молодежи г. Бобруйска"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Пример: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "СВОИ API v1");
    c.RoutePrefix = string.Empty;
});

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SignalR Hub endpoints
app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<MapHub>("/hubs/map");

// Run automatic seeding for Bobruisk POIs and city news
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<SvoiDbContext>();
    try
    {
        await DbSeeder.SeedInitialDataAsync(dbContext);
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Could not run DbSeeder (e.g. database migration not applied yet)");
    }
}

app.Run();
