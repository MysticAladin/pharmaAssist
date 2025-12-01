using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Persistence;

/// <summary>
/// Seeds initial data into the database
/// </summary>
public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            // Apply any pending migrations
            await context.Database.MigrateAsync();

            // Seed Roles
            await SeedRolesAsync(roleManager, logger);

            // Seed Admin User
            await SeedAdminUserAsync(userManager, logger);

            // Seed Cantons (Bosnia and Herzegovina)
            await SeedCantonsAsync(context, logger);

            logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }
    }

    private static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager, ILogger logger)
    {
        var roles = new[]
        {
            new ApplicationRole { Name = "Admin", Description = "System Administrator with full access" },
            new ApplicationRole { Name = "Manager", Description = "Manager with operational access" },
            new ApplicationRole { Name = "Pharmacist", Description = "Licensed pharmacist" },
            new ApplicationRole { Name = "PharmacyTechnician", Description = "Pharmacy technician" },
            new ApplicationRole { Name = "WarehouseManager", Description = "Warehouse operations manager" },
            new ApplicationRole { Name = "SalesRepresentative", Description = "Sales and customer relations" },
            new ApplicationRole { Name = "User", Description = "Standard user with limited access" }
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role.Name!))
            {
                role.CreatedAt = DateTime.UtcNow;
                await roleManager.CreateAsync(role);
                logger.LogInformation("Created role: {RoleName}", role.Name);
            }
        }
    }

    private static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager, ILogger logger)
    {
        const string adminEmail = "admin@pharmaassist.ba";
        const string adminPassword = "Admin@123!";

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "System",
                LastName = "Administrator",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminUser, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRolesAsync(adminUser, new[] { "Admin", "Manager" });
                logger.LogInformation("Created admin user: {Email}", adminEmail);
            }
            else
            {
                logger.LogError("Failed to create admin user: {Errors}", 
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }

    private static async Task SeedCantonsAsync(ApplicationDbContext context, ILogger logger)
    {
        // First ensure BiH entities exist
        if (!await context.BiHEntities.AnyAsync())
        {
            var entities = new[]
            {
                new BiHEntity { Code = "FBiH", Name = "Federation of Bosnia and Herzegovina", NameLocal = "Federacija Bosne i Hercegovine", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BiHEntity { Code = "RS", Name = "Republika Srpska", NameLocal = "Република Српска", IsActive = true, CreatedAt = DateTime.UtcNow },
                new BiHEntity { Code = "BD", Name = "Brčko District", NameLocal = "Brčko Distrikt", IsActive = true, CreatedAt = DateTime.UtcNow }
            };
            context.BiHEntities.AddRange(entities);
            await context.SaveChangesAsync();
            logger.LogInformation("Seeded BiH entities");
        }

        if (await context.Cantons.AnyAsync())
        {
            return; // Cantons already seeded
        }

        var fbih = await context.BiHEntities.FirstAsync(e => e.Code == "FBiH");
        var rs = await context.BiHEntities.FirstAsync(e => e.Code == "RS");
        var bd = await context.BiHEntities.FirstAsync(e => e.Code == "BD");

        var cantons = new[]
        {
            // Federation of Bosnia and Herzegovina Cantons
            new Canton { Code = "USK", Name = "Una-Sana Canton", NameLocal = "Unsko-sanski kanton", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "PSK", Name = "Posavina Canton", NameLocal = "Posavski kanton", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "TK", Name = "Tuzla Canton", NameLocal = "Tuzlanski kanton", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "ZDK", Name = "Zenica-Doboj Canton", NameLocal = "Zeničko-dobojski kanton", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "BPK", Name = "Bosnian-Podrinje Canton", NameLocal = "Bosansko-podrinjski kanton", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "SBK", Name = "Central Bosnia Canton", NameLocal = "Srednjobosanski kanton", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "HNK", Name = "Herzegovina-Neretva Canton", NameLocal = "Hercegovačko-neretvanski kanton", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "ZHK", Name = "West Herzegovina Canton", NameLocal = "Zapadnohercegovački kanton", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "KS", Name = "Sarajevo Canton", NameLocal = "Kanton Sarajevo", BiHEntityId = fbih.Id, IsActive = true },
            new Canton { Code = "K10", Name = "Canton 10", NameLocal = "Kanton 10 (Livanjski kanton)", BiHEntityId = fbih.Id, IsActive = true },
            
            // Republika Srpska regions (treated as administrative units)
            new Canton { Code = "RS-BL", Name = "Banja Luka Region", NameLocal = "Banjalučka regija", BiHEntityId = rs.Id, IsActive = true },
            new Canton { Code = "RS-DB", Name = "Doboj Region", NameLocal = "Dobojska regija", BiHEntityId = rs.Id, IsActive = true },
            new Canton { Code = "RS-BI", Name = "Bijeljina Region", NameLocal = "Bijeljinska regija", BiHEntityId = rs.Id, IsActive = true },
            new Canton { Code = "RS-IS", Name = "East Sarajevo Region", NameLocal = "Istočno Sarajevo regija", BiHEntityId = rs.Id, IsActive = true },
            new Canton { Code = "RS-TR", Name = "Trebinje Region", NameLocal = "Trebinjska regija", BiHEntityId = rs.Id, IsActive = true },
            new Canton { Code = "RS-PR", Name = "Prijedor Region", NameLocal = "Prijedorska regija", BiHEntityId = rs.Id, IsActive = true },
            new Canton { Code = "RS-FO", Name = "Foča Region", NameLocal = "Fočanska regija", BiHEntityId = rs.Id, IsActive = true },
            
            // Brčko District
            new Canton { Code = "BD", Name = "Brčko District", NameLocal = "Brčko Distrikt", BiHEntityId = bd.Id, IsActive = true }
        };

        foreach (var canton in cantons)
        {
            canton.CreatedAt = DateTime.UtcNow;
        }

        context.Cantons.AddRange(cantons);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} cantons", cantons.Length);
    }
}
