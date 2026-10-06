using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using Svoi.Domain.Entities;

namespace Svoi.Infrastructure.Data;

public static class DbSeeder
{
    private static readonly GeometryFactory _geometryFactory = new(new PrecisionModel(), 4326);

    public static async Task SeedInitialDataAsync(SvoiDbContext context)
    {
        // Check if database can be connected to
        if (!await context.Database.CanConnectAsync())
        {
            return;
        }

        // Seed Points of Interest (Bobruisk)
        if (!await context.PointsOfInterest.AnyAsync())
        {
            var socialka = new PointOfInterest
            {
                Title = "Пешеходная Социалка (ул. Социалистическая)",
                Category = "Прогулки и движ",
                DiscountDescription = "Эпицентр вечерних встреч молодежи, музыканты, уличный кофе.",
                HasDiscount = true,
                Latitude = 53.1378,
                Longitude = 29.2245,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var club1387 = new PointOfInterest
            {
                Title = "Тайм-клуб «1387»",
                Category = "Кафе и коворкинг",
                DiscountDescription = "Скидка 20% на весь кофе при показе статуса «Я гуляю» в приложении СВОИ.",
                HasDiscount = true,
                Latitude = 53.1390,
                Longitude = 29.2230,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var beaver = new PointOfInterest
            {
                Title = "Скульптура Бобра (ул. К. Маркса)",
                Category = "Достопримечательности",
                DiscountDescription = "Главный фотоспот города. Место старта клановых квестов.",
                HasDiscount = false,
                Latitude = 53.1375,
                Longitude = 29.2240,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var arena = new PointOfInterest
            {
                Title = "Бобруйск-Арена",
                Category = "Спорт и активности",
                DiscountDescription = "Скидка 10% на сеансы массового катания кланам от 3 человек.",
                HasDiscount = true,
                Latitude = 53.1415,
                Longitude = 29.2450,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var fortress = new PointOfInterest
            {
                Title = "Бобруйская Крепость & Набережная Березины",
                Category = "Природа и закаты",
                DiscountDescription = "Лучший вид на реку, романтические прогулки и вечерние костры.",
                HasDiscount = false,
                Latitude = 53.1340,
                Longitude = 29.2420,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var park = new PointOfInterest
            {
                Title = "Молодежный парк",
                Category = "Парки и скверы",
                DiscountDescription = "Воркаут-площадка, фонтаны и зеленые аллеи для длинных прогулок.",
                HasDiscount = false,
                Latitude = 53.1450,
                Longitude = 29.2150,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var dodo = new PointOfInterest
            {
                Title = "Додо Пицца (ул. Минская)",
                Category = "Еда и напитки",
                DiscountDescription = "Скидка 15% на комбо для кланов со стриком от 3 недель!",
                HasDiscount = true,
                Latitude = 53.1420,
                Longitude = 29.2190,
                CreatedAt = DateTimeOffset.UtcNow
            };

            context.PointsOfInterest.AddRange(socialka, club1387, beaver, arena, fortress, park, dodo);
            await context.SaveChangesAsync();

            // Partner promocodes
            context.PartnerPromocodes.AddRange(
                new PartnerPromocode
                {
                    PoiId = club1387.Id,
                    Title = "Бесплатный фильтр-кофе в клубе «1387»",
                    CostInPoints = 150,
                    PromoCode = "SVOI-COFFEE-1387",
                    IsRedeemed = false
                },
                new PartnerPromocode
                {
                    PoiId = dodo.Id,
                    Title = "Скидка 25% на большую пиццу в Додо Бобруйск",
                    CostInPoints = 250,
                    PromoCode = "SVOI-DODO-BOBR25",
                    IsRedeemed = false
                },
                new PartnerPromocode
                {
                    PoiId = arena.Id,
                    Title = "Бесплатный вход на массовое катание в Арене",
                    CostInPoints = 300,
                    PromoCode = "SVOI-ARENA-SKATE",
                    IsRedeemed = false
                }
            );
            await context.SaveChangesAsync();
        }

        // Seed City News & Flash Events
        if (!await context.CityNews.AnyAsync())
        {
            context.CityNews.AddRange(
                new CityNews
                {
                    Title = "🔥 Flash-акция: Акустический джем на Социалке!",
                    Content = "Сегодня с 19:30 до 22:00 на пешеходной Социалке собираются уличные музыканты. Бери друзей, клан и приходи слушать живой звук!",
                    ImageUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
                    IsFlashEvent = true,
                    ExpiresAt = DateTimeOffset.UtcNow.AddHours(6),
                    CreatedAt = DateTimeOffset.UtcNow
                },
                new CityNews
                {
                    Title = "Ночной стрит-воркаут в Молодежном парке",
                    Content = "Клан «Бобруйские Турникмены» объявляет открытый сбор для всех желающих размяться перед сном. Встреча у главной перекладины в 21:00.",
                    ImageUrl = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
                    IsFlashEvent = false,
                    ExpiresAt = DateTimeOffset.UtcNow.AddDays(1),
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
                },
                new CityNews
                {
                    Title = "Закат над Березиной: сбор на смотровой площадке Крепости",
                    Content = "Идеальная погода для вечерней прогулки. Делай фото кружков верификации с видом на воду и собирай стрик со своими!",
                    ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
                    IsFlashEvent = false,
                    ExpiresAt = DateTimeOffset.UtcNow.AddDays(2),
                    CreatedAt = DateTimeOffset.UtcNow.AddHours(-5)
                }
            );
            await context.SaveChangesAsync();
        }
    }
}
