using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Svoi.Infrastructure.Data;

public class SvoiDbContextFactory : IDesignTimeDbContextFactory<SvoiDbContext>
{
    public SvoiDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SvoiDbContext>();

        // Default local PostGIS connection string for migrations
        var connectionString = "Host=localhost;Port=5432;Database=svoi_db;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString);

        return new SvoiDbContext(optionsBuilder.Options);
    }
}
