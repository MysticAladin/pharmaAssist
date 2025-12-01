using Domain.Entities;

namespace Domain.Interfaces;

/// <summary>
/// BiH Location repository for administrative divisions
/// </summary>
public interface IBiHLocationRepository
{
    // BiH Entities (FBiH, RS, Brčko)
    Task<IReadOnlyList<BiHEntity>> GetAllEntitiesAsync(CancellationToken cancellationToken = default);
    Task<BiHEntity?> GetEntityByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<BiHEntity?> GetEntityByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<BiHEntity?> GetEntityWithCantonsAsync(int id, CancellationToken cancellationToken = default);

    // Cantons
    Task<IReadOnlyList<Canton>> GetAllCantonsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Canton>> GetCantonsByEntityAsync(int entityId, CancellationToken cancellationToken = default);
    Task<Canton?> GetCantonByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Canton?> GetCantonByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<Canton?> GetCantonWithMunicipalitiesAsync(int id, CancellationToken cancellationToken = default);

    // Municipalities
    Task<IReadOnlyList<Municipality>> GetAllMunicipalitiesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Municipality>> GetMunicipalitiesByCantonAsync(int cantonId, CancellationToken cancellationToken = default);
    Task<Municipality?> GetMunicipalityByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Municipality?> GetMunicipalityByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<Municipality?> GetMunicipalityWithCitiesAsync(int id, CancellationToken cancellationToken = default);

    // Cities
    Task<IReadOnlyList<City>> GetAllCitiesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<City>> GetCitiesByMunicipalityAsync(int municipalityId, CancellationToken cancellationToken = default);
    Task<City?> GetCityByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<City>> SearchCitiesAsync(string searchTerm, CancellationToken cancellationToken = default);

    // Full hierarchy
    Task<IReadOnlyList<BiHEntity>> GetFullHierarchyAsync(CancellationToken cancellationToken = default);
}
