using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

/// <summary>
/// BiH Location repository implementation
/// </summary>
public class BiHLocationRepository : IBiHLocationRepository
{
    private readonly ApplicationDbContext _context;

    public BiHLocationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    #region BiH Entities

    public async Task<IReadOnlyList<BiHEntity>> GetAllEntitiesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.BiHEntities
            .Where(e => e.IsActive)
            .OrderBy(e => e.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<BiHEntity?> GetEntityByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.BiHEntities
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<BiHEntity?> GetEntityByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.BiHEntities
            .FirstOrDefaultAsync(e => e.Code == code, cancellationToken);
    }

    public async Task<BiHEntity?> GetEntityWithCantonsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.BiHEntities
            .Include(e => e.Cantons.Where(c => c.IsActive))
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    #endregion

    #region Cantons

    public async Task<IReadOnlyList<Canton>> GetAllCantonsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Cantons
            .Where(c => c.IsActive)
            .Include(c => c.BiHEntity)
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Canton>> GetCantonsByEntityAsync(int entityId, CancellationToken cancellationToken = default)
    {
        return await _context.Cantons
            .Where(c => c.BiHEntityId == entityId && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Canton?> GetCantonByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Cantons
            .Include(c => c.BiHEntity)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Canton?> GetCantonByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Cantons
            .Include(c => c.BiHEntity)
            .FirstOrDefaultAsync(c => c.Code == code, cancellationToken);
    }

    public async Task<Canton?> GetCantonWithMunicipalitiesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Cantons
            .Include(c => c.BiHEntity)
            .Include(c => c.Municipalities.Where(m => m.IsActive))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    #endregion

    #region Municipalities

    public async Task<IReadOnlyList<Municipality>> GetAllMunicipalitiesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Municipalities
            .Where(m => m.IsActive)
            .Include(m => m.Canton)
            .OrderBy(m => m.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Municipality>> GetMunicipalitiesByCantonAsync(int cantonId, CancellationToken cancellationToken = default)
    {
        return await _context.Municipalities
            .Where(m => m.CantonId == cantonId && m.IsActive)
            .OrderBy(m => m.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Municipality?> GetMunicipalityByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Municipalities
            .Include(m => m.Canton)
                .ThenInclude(c => c.BiHEntity)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<Municipality?> GetMunicipalityByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Municipalities
            .Include(m => m.Canton)
            .FirstOrDefaultAsync(m => m.Code == code, cancellationToken);
    }

    public async Task<Municipality?> GetMunicipalityWithCitiesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Municipalities
            .Include(m => m.Canton)
            .Include(m => m.Cities.Where(c => c.IsActive))
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    #endregion

    #region Cities

    public async Task<IReadOnlyList<City>> GetAllCitiesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Cities
            .Where(c => c.IsActive)
            .Include(c => c.Municipality)
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<City>> GetCitiesByMunicipalityAsync(int municipalityId, CancellationToken cancellationToken = default)
    {
        return await _context.Cities
            .Where(c => c.MunicipalityId == municipalityId && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<City?> GetCityByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Cities
            .Include(c => c.Municipality)
                .ThenInclude(m => m.Canton)
                    .ThenInclude(ct => ct.BiHEntity)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<City>> SearchCitiesAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _context.Cities
            .Where(c => c.IsActive && 
                       (c.Name.ToLower().Contains(term) || 
                        c.NameLocal.ToLower().Contains(term) ||
                        (c.PostalCode != null && c.PostalCode.Contains(term))))
            .Include(c => c.Municipality)
            .OrderBy(c => c.Name)
            .Take(50)
            .ToListAsync(cancellationToken);
    }

    #endregion

    #region Full Hierarchy

    public async Task<IReadOnlyList<BiHEntity>> GetFullHierarchyAsync(CancellationToken cancellationToken = default)
    {
        return await _context.BiHEntities
            .Where(e => e.IsActive)
            .Include(e => e.Cantons.Where(c => c.IsActive))
                .ThenInclude(c => c.Municipalities.Where(m => m.IsActive))
                    .ThenInclude(m => m.Cities.Where(ct => ct.IsActive))
            .OrderBy(e => e.Name)
            .ToListAsync(cancellationToken);
    }

    #endregion
}
