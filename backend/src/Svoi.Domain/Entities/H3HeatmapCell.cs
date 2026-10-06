using System;

namespace Svoi.Domain.Entities;

public class H3HeatmapCell
{
    public string H3Index { get; set; } = string.Empty;
    public int UserCount { get; set; }
    public string Intensity { get; set; } = "Green"; // Green (10-20), Orange (21-40), Red (41+)
    public DateTimeOffset CalculatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? BoundaryGeoJson { get; set; }
}
