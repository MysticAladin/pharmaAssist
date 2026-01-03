using Domain.Entities;
using Domain.Enums;
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

            // Seed Customer Portal User
            await SeedCustomerUserAsync(userManager, context, logger);

            // Seed Cantons (Bosnia and Herzegovina)
            await SeedCantonsAsync(context, logger);

            // Seed Feature Flags
            await SeedFeatureFlagsAsync(context, logger);

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
            new ApplicationRole { Name = "Customer", Description = "Customer portal user" },
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

    private static async Task SeedCustomerUserAsync(
        UserManager<ApplicationUser> userManager, 
        ApplicationDbContext context, 
        ILogger logger)
    {
        const string customerEmail = "customer@apoteka-sarajevo.ba";
        const string customerPassword = "Customer@123!";

        var customerUser = await userManager.FindByEmailAsync(customerEmail);
        if (customerUser == null)
        {
            customerUser = new ApplicationUser
            {
                UserName = customerEmail,
                Email = customerEmail,
                FirstName = "Emir",
                LastName = "Hodžić",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(customerUser, customerPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(customerUser, "Customer");
                logger.LogInformation("Created customer user: {Email}", customerEmail);

                // Create associated Customer entity
                var existingCustomer = await context.Customers
                    .FirstOrDefaultAsync(c => c.UserId == customerUser.Id);
                
                if (existingCustomer == null)
                {
                    var customer = new Customer
                    {
                        UserId = customerUser.Id,
                        CustomerCode = "CUST-001",
                        CustomerType = CustomerType.Pharmacy,
                        FirstName = customerUser.FirstName,
                        LastName = customerUser.LastName,
                        CompanyName = "Apoteka Sarajevo",
                        Email = customerUser.Email,
                        Phone = "+387 33 555 123",
                        MobilePhone = "+387 61 123 456",
                        TaxId = "200123456789",
                        RegistrationNumber = "4200123456789",
                        CreditLimit = 50000,
                        PaymentTermsDays = 30,
                        Tier = CustomerTier.A,
                        IsActive = true,
                        IsVerified = true,
                        VerifiedAt = DateTime.UtcNow,
                        VerifiedBy = "system",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "system"
                    };

                    context.Customers.Add(customer);
                    await context.SaveChangesAsync();

                    // Add default address
                    var address = new CustomerAddress
                    {
                        CustomerId = customer.Id,
                        AddressType = AddressType.Both,
                        Street = "Maršala Tita 9a",
                        City = "Sarajevo",
                        PostalCode = "71000",
                        ContactName = "Emir Hodžić",
                        ContactPhone = "+387 61 123 456",
                        IsDefault = true,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = "system"
                    };

                    context.CustomerAddresses.Add(address);
                    await context.SaveChangesAsync();

                    logger.LogInformation("Created customer entity for: {CustomerName}", customer.FullName);
                }
            }
            else
            {
                logger.LogError("Failed to create customer user: {Errors}", 
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
                new BiHEntity { Code = "RS", Name = "Republika Srpska", NameLocal = "Republika Srpska", IsActive = true, CreatedAt = DateTime.UtcNow },
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

            // Republika Srpska and Brčko modeled as single administrative units
            new Canton { Code = "RS", Name = "Republika Srpska", NameLocal = "Republika Srpska", BiHEntityId = rs.Id, IsActive = true },
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

    private static async Task SeedFeatureFlagsAsync(ApplicationDbContext context, ILogger logger)
    {
        if (await context.SystemFeatureFlags.AnyAsync())
        {
            return; // Feature flags already seeded
        }

        var flags = new[]
        {
            // Portal Features
            new SystemFeatureFlag
            {
                Key = "portal.splitinvoice",
                Name = "Split Invoice",
                Description = "Enable splitting invoices for Commercial vs Essential medicines during checkout",
                Category = FlagCategory.Portal,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "portal.quickorder",
                Name = "Quick Order",
                Description = "Enable quick order functionality for repeat orders",
                Category = FlagCategory.Portal,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "portal.favoriteproducts",
                Name = "Favorite Products",
                Description = "Enable favorites/wishlist functionality",
                Category = FlagCategory.Portal,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = false,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "portal.ordertracking",
                Name = "Order Tracking",
                Description = "Enable real-time order tracking",
                Category = FlagCategory.Portal,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = false,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "portal.productrecommendations",
                Name = "Product Recommendations",
                Description = "Show AI-powered product recommendations",
                Category = FlagCategory.Portal,
                Type = FlagType.Boolean,
                Value = "false",
                DefaultValue = "false",
                IsEnabled = false,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },

            // Billing Features
            new SystemFeatureFlag
            {
                Key = "billing.creditlimit",
                Name = "Credit Limit Enforcement",
                Description = "Enforce customer credit limits during checkout",
                Category = FlagCategory.Billing,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "billing.autoinvoice",
                Name = "Auto Invoice Generation",
                Description = "Automatically generate invoices upon order confirmation",
                Category = FlagCategory.Billing,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },

            // Orders Features
            new SystemFeatureFlag
            {
                Key = "orders.prescriptionupload",
                Name = "Prescription Upload",
                Description = "Allow uploading prescriptions with orders",
                Category = FlagCategory.Orders,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = false,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "orders.minimumorder",
                Name = "Minimum Order Amount",
                Description = "The minimum order amount in KM",
                Category = FlagCategory.Orders,
                Type = FlagType.Number,
                Value = "50",
                DefaultValue = "50",
                IsEnabled = true,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },

            // Inventory Features
            new SystemFeatureFlag
            {
                Key = "inventory.lowstockalerts",
                Name = "Low Stock Alerts",
                Description = "Send notifications when stock falls below threshold",
                Category = FlagCategory.Inventory,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = false,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "inventory.expiryalerts",
                Name = "Expiry Alerts",
                Description = "Send notifications for products nearing expiry",
                Category = FlagCategory.Inventory,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = false,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },

            // Reports Features
            new SystemFeatureFlag
            {
                Key = "reports.pdfexport",
                Name = "PDF Export",
                Description = "Enable PDF export for reports",
                Category = FlagCategory.Reports,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = false,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "reports.excelexport",
                Name = "Excel Export",
                Description = "Enable Excel export for reports",
                Category = FlagCategory.Reports,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = false,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },

            // UI Features
            new SystemFeatureFlag
            {
                Key = "ui.darkmode",
                Name = "Dark Mode",
                Description = "Enable dark mode theme option",
                Category = FlagCategory.UI,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "ui.compactview",
                Name = "Compact View",
                Description = "Enable compact view option for data tables",
                Category = FlagCategory.UI,
                Type = FlagType.Boolean,
                Value = "true",
                DefaultValue = "true",
                IsEnabled = true,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },

            // Experimental Features
            new SystemFeatureFlag
            {
                Key = "experimental.aichatbot",
                Name = "AI Chatbot",
                Description = "Enable AI-powered customer support chatbot",
                Category = FlagCategory.Experimental,
                Type = FlagType.Boolean,
                Value = "false",
                DefaultValue = "false",
                IsEnabled = false,
                AllowClientOverride = true,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            },
            new SystemFeatureFlag
            {
                Key = "experimental.voiceordering",
                Name = "Voice Ordering",
                Description = "Enable voice-based ordering (experimental)",
                Category = FlagCategory.Experimental,
                Type = FlagType.Boolean,
                Value = "false",
                DefaultValue = "false",
                IsEnabled = false,
                AllowClientOverride = false,
                CreatedBy = "system",
                CreatedAt = DateTime.UtcNow
            }
        };

        context.SystemFeatureFlags.AddRange(flags);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} feature flags", flags.Length);
    }
}
