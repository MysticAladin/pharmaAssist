using Application.DTOs.Common;
using Application.DTOs.Locations;

namespace Application.Interfaces;

/// <summary>
/// BiH Location service interface for administrative divisions
/// </summary>
public interface ILocationService
{
    // BiH Entities (FBiH, RS, BD)
    Task<ApiResponse<IEnumerable<BiHEntityDto>>> GetAllEntitiesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<BiHEntityDto>> GetEntityByIdAsync(int id, CancellationToken cancellationToken = default);
    
    // Cantons
    Task<ApiResponse<IEnumerable<CantonDto>>> GetAllCantonsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CantonDto>>> GetCantonsByEntityAsync(int entityId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CantonDto>> GetCantonByIdAsync(int id, CancellationToken cancellationToken = default);
    
    // Municipalities
    Task<ApiResponse<IEnumerable<MunicipalityDto>>> GetAllMunicipalitiesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<MunicipalityDto>>> GetMunicipalitiesByCantonAsync(int cantonId, CancellationToken cancellationToken = default);
    Task<ApiResponse<MunicipalityDto>> GetMunicipalityByIdAsync(int id, CancellationToken cancellationToken = default);
    
    // Cities
    Task<ApiResponse<IEnumerable<CityDto>>> GetAllCitiesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CityDto>>> GetCitiesByMunicipalityAsync(int municipalityId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CityDto>> GetCityByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CitySummaryDto>>> SearchCitiesAsync(string searchTerm, CancellationToken cancellationToken = default);
    
    // Hierarchy
    Task<ApiResponse<IEnumerable<LocationHierarchyDto>>> GetFullHierarchyAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<LocationHierarchyDto>> GetHierarchyByEntityAsync(int entityId, CancellationToken cancellationToken = default);
}
