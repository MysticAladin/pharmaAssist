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

    IRepository<Domain.Entities.NotificationEmailRecipient> NotificationEmailRecipients { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
