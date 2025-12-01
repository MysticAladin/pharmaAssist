using Application.DTOs.Common;
using Application.DTOs.Locations;
using Application.Interfaces;
using AutoMapper;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Location service implementation for BiH administrative divisions
/// </summary>
public class LocationService : ILocationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<LocationService> _logger;

    public LocationService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<LocationService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    // BiH Entities
    public async Task<ApiResponse<IEnumerable<BiHEntityDto>>> GetAllEntitiesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var entities = await _unitOfWork.BiHLocations.GetAllEntitiesAsync(cancellationToken);
            var dtos = _mapper.Map<IEnumerable<BiHEntityDto>>(entities);
            return ApiResponse<IEnumerable<BiHEntityDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all BiH entities");
            return ApiResponse<IEnumerable<BiHEntityDto>>.Fail("An error occurred while retrieving BiH entities");
        }
    }

    public async Task<ApiResponse<BiHEntityDto>> GetEntityByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.BiHLocations.GetEntityByIdAsync(id, cancellationToken);
            if (entity == null)
            {
                return ApiResponse<BiHEntityDto>.Fail($"BiH entity with ID {id} not found");
            }

            var dto = _mapper.Map<BiHEntityDto>(entity);
            return ApiResponse<BiHEntityDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting BiH entity by ID {Id}", id);
            return ApiResponse<BiHEntityDto>.Fail("An error occurred while retrieving the BiH entity");
        }
    }

    // Cantons
    public async Task<ApiResponse<IEnumerable<CantonDto>>> GetAllCantonsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var cantons = await _unitOfWork.BiHLocations.GetAllCantonsAsync(cancellationToken);
            var dtos = _mapper.Map<IEnumerable<CantonDto>>(cantons);
            return ApiResponse<IEnumerable<CantonDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all cantons");
            return ApiResponse<IEnumerable<CantonDto>>.Fail("An error occurred while retrieving cantons");
        }
    }

    public async Task<ApiResponse<IEnumerable<CantonDto>>> GetCantonsByEntityAsync(int entityId, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.BiHLocations.GetEntityByIdAsync(entityId, cancellationToken);
            if (entity == null)
            {
                return ApiResponse<IEnumerable<CantonDto>>.Fail($"BiH entity with ID {entityId} not found");
            }

            var cantons = await _unitOfWork.BiHLocations.GetCantonsByEntityAsync(entityId, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<CantonDto>>(cantons);
            return ApiResponse<IEnumerable<CantonDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cantons by entity {EntityId}", entityId);
            return ApiResponse<IEnumerable<CantonDto>>.Fail("An error occurred while retrieving cantons");
        }
    }

    public async Task<ApiResponse<CantonDto>> GetCantonByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var canton = await _unitOfWork.BiHLocations.GetCantonByIdAsync(id, cancellationToken);
            if (canton == null)
            {
                return ApiResponse<CantonDto>.Fail($"Canton with ID {id} not found");
            }

            var dto = _mapper.Map<CantonDto>(canton);
            return ApiResponse<CantonDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting canton by ID {Id}", id);
            return ApiResponse<CantonDto>.Fail("An error occurred while retrieving the canton");
        }
    }

    // Municipalities
    public async Task<ApiResponse<IEnumerable<MunicipalityDto>>> GetAllMunicipalitiesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var municipalities = await _unitOfWork.BiHLocations.GetAllMunicipalitiesAsync(cancellationToken);
            var dtos = _mapper.Map<IEnumerable<MunicipalityDto>>(municipalities);
            return ApiResponse<IEnumerable<MunicipalityDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all municipalities");
            return ApiResponse<IEnumerable<MunicipalityDto>>.Fail("An error occurred while retrieving municipalities");
        }
    }

    public async Task<ApiResponse<IEnumerable<MunicipalityDto>>> GetMunicipalitiesByCantonAsync(int cantonId, CancellationToken cancellationToken = default)
    {
        try
        {
            var canton = await _unitOfWork.BiHLocations.GetCantonByIdAsync(cantonId, cancellationToken);
            if (canton == null)
            {
                return ApiResponse<IEnumerable<MunicipalityDto>>.Fail($"Canton with ID {cantonId} not found");
            }

            var municipalities = await _unitOfWork.BiHLocations.GetMunicipalitiesByCantonAsync(cantonId, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<MunicipalityDto>>(municipalities);
            return ApiResponse<IEnumerable<MunicipalityDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting municipalities by canton {CantonId}", cantonId);
            return ApiResponse<IEnumerable<MunicipalityDto>>.Fail("An error occurred while retrieving municipalities");
        }
    }

    public async Task<ApiResponse<MunicipalityDto>> GetMunicipalityByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var municipality = await _unitOfWork.BiHLocations.GetMunicipalityByIdAsync(id, cancellationToken);
            if (municipality == null)
            {
                return ApiResponse<MunicipalityDto>.Fail($"Municipality with ID {id} not found");
            }

            var dto = _mapper.Map<MunicipalityDto>(municipality);
            return ApiResponse<MunicipalityDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting municipality by ID {Id}", id);
            return ApiResponse<MunicipalityDto>.Fail("An error occurred while retrieving the municipality");
        }
    }

    // Cities
    public async Task<ApiResponse<IEnumerable<CityDto>>> GetAllCitiesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var cities = await _unitOfWork.BiHLocations.GetAllCitiesAsync(cancellationToken);
            var dtos = _mapper.Map<IEnumerable<CityDto>>(cities);
            return ApiResponse<IEnumerable<CityDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all cities");
            return ApiResponse<IEnumerable<CityDto>>.Fail("An error occurred while retrieving cities");
        }
    }

    public async Task<ApiResponse<IEnumerable<CityDto>>> GetCitiesByMunicipalityAsync(int municipalityId, CancellationToken cancellationToken = default)
    {
        try
        {
            var municipality = await _unitOfWork.BiHLocations.GetMunicipalityByIdAsync(municipalityId, cancellationToken);
            if (municipality == null)
            {
                return ApiResponse<IEnumerable<CityDto>>.Fail($"Municipality with ID {municipalityId} not found");
            }

            var cities = await _unitOfWork.BiHLocations.GetCitiesByMunicipalityAsync(municipalityId, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<CityDto>>(cities);
            return ApiResponse<IEnumerable<CityDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cities by municipality {MunicipalityId}", municipalityId);
            return ApiResponse<IEnumerable<CityDto>>.Fail("An error occurred while retrieving cities");
        }
    }

    public async Task<ApiResponse<CityDto>> GetCityByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var city = await _unitOfWork.BiHLocations.GetCityByIdAsync(id, cancellationToken);
            if (city == null)
            {
                return ApiResponse<CityDto>.Fail($"City with ID {id} not found");
            }

            var dto = _mapper.Map<CityDto>(city);
            return ApiResponse<CityDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting city by ID {Id}", id);
            return ApiResponse<CityDto>.Fail("An error occurred while retrieving the city");
        }
    }

    public async Task<ApiResponse<IEnumerable<CitySummaryDto>>> SearchCitiesAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        try
        {
            var cities = await _unitOfWork.BiHLocations.SearchCitiesAsync(searchTerm, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<CitySummaryDto>>(cities);
            return ApiResponse<IEnumerable<CitySummaryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching cities with term {SearchTerm}", searchTerm);
            return ApiResponse<IEnumerable<CitySummaryDto>>.Fail("An error occurred while searching cities");
        }
    }

    // Hierarchy
    public async Task<ApiResponse<IEnumerable<LocationHierarchyDto>>> GetFullHierarchyAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var entities = await _unitOfWork.BiHLocations.GetFullHierarchyAsync(cancellationToken);
            var hierarchyList = new List<LocationHierarchyDto>();

            foreach (var entity in entities)
            {
                var hierarchy = await BuildHierarchyForEntityAsync(entity.Id, cancellationToken);
                hierarchyList.Add(hierarchy);
            }

            return ApiResponse<IEnumerable<LocationHierarchyDto>>.Ok(hierarchyList);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting full location hierarchy");
            return ApiResponse<IEnumerable<LocationHierarchyDto>>.Fail("An error occurred while retrieving the location hierarchy");
        }
    }

    public async Task<ApiResponse<LocationHierarchyDto>> GetHierarchyByEntityAsync(int entityId, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await _unitOfWork.BiHLocations.GetEntityByIdAsync(entityId, cancellationToken);
            if (entity == null)
            {
                return ApiResponse<LocationHierarchyDto>.Fail($"BiH entity with ID {entityId} not found");
            }

            var hierarchy = await BuildHierarchyForEntityAsync(entityId, cancellationToken);
            return ApiResponse<LocationHierarchyDto>.Ok(hierarchy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting hierarchy for entity {EntityId}", entityId);
            return ApiResponse<LocationHierarchyDto>.Fail("An error occurred while retrieving the location hierarchy");
        }
    }

    // Helper methods
    private async Task<LocationHierarchyDto> BuildHierarchyForEntityAsync(int entityId, CancellationToken cancellationToken)
    {
        var entity = await _unitOfWork.BiHLocations.GetEntityByIdAsync(entityId, cancellationToken);
        var cantons = await _unitOfWork.BiHLocations.GetCantonsByEntityAsync(entityId, cancellationToken);

        var hierarchy = new LocationHierarchyDto
        {
            BiHEntityId = entity!.Id,
            BiHEntityName = entity.Name,
            Cantons = new List<CantonWithMunicipalitiesDto>()
        };

        foreach (var canton in cantons)
        {
            var municipalities = await _unitOfWork.BiHLocations.GetMunicipalitiesByCantonAsync(canton.Id, cancellationToken);
            var cantonDto = new CantonWithMunicipalitiesDto
            {
                Id = canton.Id,
                Name = canton.Name,
                Code = canton.Code,
                Municipalities = new List<MunicipalityWithCitiesDto>()
            };

            foreach (var municipality in municipalities)
            {
                var cities = await _unitOfWork.BiHLocations.GetCitiesByMunicipalityAsync(municipality.Id, cancellationToken);
                var municipalityDto = new MunicipalityWithCitiesDto
                {
                    Id = municipality.Id,
                    Name = municipality.Name,
                    Cities = _mapper.Map<List<CitySummaryDto>>(cities)
                };
                cantonDto.Municipalities.Add(municipalityDto);
            }

            hierarchy.Cantons.Add(cantonDto);
        }

        return hierarchy;
    }
}
