namespace Domain.Interfaces;

/// <summary>
/// Unit of Work pattern for coordinating multiple repositories
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IProductRepository Products { get; }
    ICategoryRepository Categories { get; }
    IManufacturerRepository Manufacturers { get; }
    ICustomerRepository Customers { get; }
    IOrderRepository Orders { get; }
    IBiHLocationRepository BiHLocations { get; }
    IInventoryRepository Inventory { get; }
    ISalesRepRepository SalesReps { get; }

    IRepository<Domain.Entities.NotificationEmailRecipient> NotificationEmailRecipients { get; }
    IRepository<Domain.Entities.Brand> Brands { get; }
    IRepository<Domain.Entities.BrandGroup> BrandGroups { get; }
    IRepository<Domain.Entities.BrandGroupMember> BrandGroupMembers { get; }
    IRepository<Domain.Entities.ProductDocument> ProductDocuments { get; }
    IRepository<Domain.Entities.KnowledgeArticle> KnowledgeArticles { get; }
    IRepository<Domain.Entities.ExecutedVisit> ExecutedVisits { get; }
    IRepository<Domain.Entities.Cycle> Cycles { get; }
    IRepository<Domain.Entities.CycleTarget> CycleTargets { get; }
    IRepository<Domain.Entities.Campaign> Campaigns { get; }
    IRepository<Domain.Entities.CampaignTarget> CampaignTargets { get; }
    IRepository<Domain.Entities.CampaignExpense> CampaignExpenses { get; }
    IRepository<Domain.Entities.Territory> Territories { get; }
    IRepository<Domain.Entities.TerritoryAssignment> TerritoryAssignments { get; }
    IRepository<Domain.Entities.WholesalerDataImport> WholesalerDataImports { get; }
    IRepository<Domain.Entities.WholesalerSalesRecord> WholesalerSalesRecords { get; }
    IRepository<Domain.Entities.WholesalerStockRecord> WholesalerStockRecords { get; }
    IRepository<Domain.Entities.PriceList> PriceLists { get; }
    IRepository<Domain.Entities.PriceListItem> PriceListItems { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
