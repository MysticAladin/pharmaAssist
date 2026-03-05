using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Storage;

namespace Infrastructure.Repositories;

/// <summary>
/// Unit of Work implementation
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    private IProductRepository? _products;
    private ICategoryRepository? _categories;
    private IManufacturerRepository? _manufacturers;
    private ICustomerRepository? _customers;
    private IOrderRepository? _orders;
    private IBiHLocationRepository? _biHLocations;
    private IInventoryRepository? _inventory;
    private ISalesRepRepository? _salesReps;
    private IRepository<Domain.Entities.NotificationEmailRecipient>? _notificationEmailRecipients;
    private IRepository<Domain.Entities.Brand>? _brands;
    private IRepository<Domain.Entities.BrandGroup>? _brandGroups;
    private IRepository<Domain.Entities.BrandGroupMember>? _brandGroupMembers;
    private IRepository<Domain.Entities.ProductDocument>? _productDocuments;
    private IRepository<Domain.Entities.KnowledgeArticle>? _knowledgeArticles;
    private IRepository<Domain.Entities.ExecutedVisit>? _executedVisits;
    private IRepository<Domain.Entities.Cycle>? _cycles;
    private IRepository<Domain.Entities.CycleTarget>? _cycleTargets;
    private IRepository<Domain.Entities.Campaign>? _campaigns;
    private IRepository<Domain.Entities.CampaignTarget>? _campaignTargets;
    private IRepository<Domain.Entities.CampaignExpense>? _campaignExpenses;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IProductRepository Products => 
        _products ??= new ProductRepository(_context);

    public ICategoryRepository Categories => 
        _categories ??= new CategoryRepository(_context);

    public IManufacturerRepository Manufacturers => 
        _manufacturers ??= new ManufacturerRepository(_context);

    public ICustomerRepository Customers => 
        _customers ??= new CustomerRepository(_context);

    public IOrderRepository Orders => 
        _orders ??= new OrderRepository(_context);

    public IBiHLocationRepository BiHLocations => 
        _biHLocations ??= new BiHLocationRepository(_context);

    public IInventoryRepository Inventory => 
        _inventory ??= new InventoryRepository(_context);

    public ISalesRepRepository SalesReps =>
        _salesReps ??= new SalesRepRepository(_context);

    public IRepository<Domain.Entities.NotificationEmailRecipient> NotificationEmailRecipients =>
        _notificationEmailRecipients ??= new Repository<Domain.Entities.NotificationEmailRecipient>(_context);

    public IRepository<Domain.Entities.Brand> Brands =>
        _brands ??= new Repository<Domain.Entities.Brand>(_context);

    public IRepository<Domain.Entities.BrandGroup> BrandGroups =>
        _brandGroups ??= new Repository<Domain.Entities.BrandGroup>(_context);

    public IRepository<Domain.Entities.BrandGroupMember> BrandGroupMembers =>
        _brandGroupMembers ??= new Repository<Domain.Entities.BrandGroupMember>(_context);

    public IRepository<Domain.Entities.ProductDocument> ProductDocuments =>
        _productDocuments ??= new Repository<Domain.Entities.ProductDocument>(_context);

    public IRepository<Domain.Entities.KnowledgeArticle> KnowledgeArticles =>
        _knowledgeArticles ??= new Repository<Domain.Entities.KnowledgeArticle>(_context);

    public IRepository<Domain.Entities.ExecutedVisit> ExecutedVisits =>
        _executedVisits ??= new Repository<Domain.Entities.ExecutedVisit>(_context);

    public IRepository<Domain.Entities.Cycle> Cycles =>
        _cycles ??= new Repository<Domain.Entities.Cycle>(_context);

    public IRepository<Domain.Entities.CycleTarget> CycleTargets =>
        _cycleTargets ??= new Repository<Domain.Entities.CycleTarget>(_context);

    public IRepository<Domain.Entities.Campaign> Campaigns =>
        _campaigns ??= new Repository<Domain.Entities.Campaign>(_context);

    public IRepository<Domain.Entities.CampaignTarget> CampaignTargets =>
        _campaignTargets ??= new Repository<Domain.Entities.CampaignTarget>(_context);

    public IRepository<Domain.Entities.CampaignExpense> CampaignExpenses =>
        _campaignExpenses ??= new Repository<Domain.Entities.CampaignExpense>(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
