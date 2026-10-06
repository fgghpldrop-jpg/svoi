using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Svoi.Application.Common.Interfaces;

namespace Svoi.Api.Hubs;

public class MapHub : Hub
{
    private readonly IH3GeoService _geoService;

    public MapHub(IH3GeoService geoService)
    {
        _geoService = geoService;
    }

    public async Task RequestActiveWalkersCount()
    {
        var count = await _geoService.GetActiveWalkersCountAsync();
        await Clients.Caller.SendAsync("ActiveWalkersCount", count);
    }

    public async Task RequestHeatmap()
    {
        var heatmap = await _geoService.GetHeatmapAsync();
        await Clients.Caller.SendAsync("HeatmapData", heatmap);
    }
}
