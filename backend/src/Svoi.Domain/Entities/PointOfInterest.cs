using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace Svoi.Domain.Entities;

public class PointOfInterest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? DiscountDescription { get; set; }
    public bool HasDiscount { get; set; } = false;
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    [NotMapped]
    public Point Location => new Point(Longitude, Latitude) { SRID = 4326 };

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<PartnerPromocode> PartnerPromocodes { get; set; } = new List<PartnerPromocode>();
}
