using System;

namespace Svoi.Domain.Entities;

public class PartnerPromocode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? PoiId { get; set; }
    public PointOfInterest? PointOfInterest { get; set; }
    public string Title { get; set; } = string.Empty;
    public int CostInPoints { get; set; } = 0;
    public string PromoCode { get; set; } = string.Empty;
    public bool IsRedeemed { get; set; } = false;
}
