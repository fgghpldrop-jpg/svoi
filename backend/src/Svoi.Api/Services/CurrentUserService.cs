using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Svoi.Application.Common.Interfaces;

namespace Svoi.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
                     ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub");
            if (claim != null && Guid.TryParse(claim.Value, out var guid))
            {
                return guid;
            }
            return null;
        }
    }

    public string? PhoneNumber => _httpContextAccessor.HttpContext?.User?.FindFirst("phone")?.Value;
}
