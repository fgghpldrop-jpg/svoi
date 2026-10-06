using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Svoi.Application.Common.Interfaces;

namespace Svoi.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(Guid userId, string phoneNumber, string firstName)
    {
        var secret = _configuration["Jwt:Secret"] ?? "Svoi_Bobruisk_Hyperlocal_Network_Super_Secret_Key_2026_Min_32_Chars!";
        var issuer = _configuration["Jwt:Issuer"] ?? "Svoi.Api";
        var audience = _configuration["Jwt:Audience"] ?? "Svoi.App";
        var expiryDays = int.TryParse(_configuration["Jwt:ExpiryDays"], out var days) ? days : 30;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim("phone", phoneNumber),
            new Claim(ClaimTypes.Name, firstName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expiryDays),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
