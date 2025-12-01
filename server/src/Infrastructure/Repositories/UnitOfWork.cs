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
