using Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
        : base(options)
    {
    }

    // BiH Administrative Divisions
    public DbSet<BiHEntity> BiHEntities { get; set; } = null!;
    public DbSet<Canton> Cantons { get; set; } = null!;
    public DbSet<Municipality> Municipalities { get; set; } = null!;
    public DbSet<City> Cities { get; set; } = null!;

    // Product Management
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Manufacturer> Manufacturers { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<ProductBatch> ProductBatches { get; set; } = null!;

    // Customer Management
    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<CustomerAddress> CustomerAddresses { get; set; } = null!;

    // Order Management
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<Prescription> Prescriptions { get; set; } = null!;
    public DbSet<Claim> Claims { get; set; } = null!;

    // Inventory Management
    public DbSet<Warehouse> Warehouses { get; set; } = null!;
    public DbSet<InventoryStock> InventoryStocks { get; set; } = null!;
    public DbSet<StockMovement> StockMovements { get; set; } = null!;

    // Authentication
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

    // Audit
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    // Files and Email
    public DbSet<FileAttachment> FileAttachments { get; set; } = null!;
    public DbSet<EmailLog> EmailLogs { get; set; } = null!;

    // Feature Flags
    public DbSet<SystemFeatureFlag> SystemFeatureFlags { get; set; } = null!;
    public DbSet<ClientFeatureFlag> ClientFeatureFlags { get; set; } = null!;
    public DbSet<FeatureFlagHistory> FeatureFlagHistory { get; set; } = null!;

    // Permissions
    public DbSet<Permission> Permissions { get; set; } = null!;
    public DbSet<RolePermission> RolePermissions { get; set; } = null!;

    // Pricing & Promotions
    public DbSet<PriceRule> PriceRules { get; set; } = null!;
    public DbSet<Promotion> Promotions { get; set; } = null!;
    public DbSet<PromotionProduct> PromotionProducts { get; set; } = null!;
    public DbSet<PromotionCategory> PromotionCategories { get; set; } = null!;
    public DbSet<PromotionUsage> PromotionUsages { get; set; } = null!;

    // Sales Targets & Budgets
    public DbSet<SalesTarget> SalesTargets { get; set; } = null!;
    public DbSet<SalesTargetProgress> SalesTargetProgress { get; set; } = null!;
    public DbSet<Budget> Budgets { get; set; } = null!;
    public DbSet<BudgetExpense> BudgetExpenses { get; set; } = null!;

    // Reports
    public DbSet<SavedReport> SavedReports { get; set; } = null!;

    // Tenders
    public DbSet<Tender> Tenders { get; set; } = null!;
    public DbSet<TenderItem> TenderItems { get; set; } = null!;
    public DbSet<TenderBid> TenderBids { get; set; } = null!;
    public DbSet<TenderBidItem> TenderBidItems { get; set; } = null!;
    public DbSet<TenderDocument> TenderDocuments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Apply all configurations from the assembly
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        
        // Customize Identity table names (optional)
        builder.Entity<ApplicationUser>().ToTable("Users");
        builder.Entity<ApplicationRole>().ToTable("Roles");
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
