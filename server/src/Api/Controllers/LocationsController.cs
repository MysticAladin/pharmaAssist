using Application.DTOs.Common;
using Application.DTOs.Locations;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Locations API Controller for BiH administrative divisions
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class LocationsController : ControllerBase
{
    private readonly ILocationService _locationService;
    private readonly ILogger<LocationsController> _logger;

    public LocationsController(ILocationService locationService, ILogger<LocationsController> logger)
    {
        _locationService = locationService;
        _logger = logger;
    }

    #region BiH Entities

    /// <summary>
    /// Get all BiH entities (FBiH, RS, BD)
    /// </summary>
    [HttpGet("entities")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<BiHEntityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllEntities(CancellationToken cancellationToken)
    {
        var result = await _locationService.GetAllEntitiesAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get BiH entity by ID
    /// </summary>
    [HttpGet("entities/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<BiHEntityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<BiHEntityDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetEntityById(int id, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetEntityByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Cantons

    /// <summary>
    /// Get all cantons
    /// </summary>
    [HttpGet("cantons")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CantonDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllCantons(CancellationToken cancellationToken)
    {
        var result = await _locationService.GetAllCantonsAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get cantons by entity
    /// </summary>
    [HttpGet("entities/{entityId:int}/cantons")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CantonDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCantonsByEntity(int entityId, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetCantonsByEntityAsync(entityId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get canton by ID
    /// </summary>
    [HttpGet("cantons/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CantonDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CantonDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCantonById(int id, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetCantonByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Municipalities

    /// <summary>
    /// Get all municipalities
    /// </summary>
    [HttpGet("municipalities")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<MunicipalityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllMunicipalities(CancellationToken cancellationToken)
    {
        var result = await _locationService.GetAllMunicipalitiesAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get municipalities by canton
    /// </summary>
    [HttpGet("cantons/{cantonId:int}/municipalities")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<MunicipalityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMunicipalitiesByCanton(int cantonId, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetMunicipalitiesByCantonAsync(cantonId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get municipality by ID
    /// </summary>
    [HttpGet("municipalities/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<MunicipalityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<MunicipalityDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMunicipalityById(int id, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetMunicipalityByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Cities

    /// <summary>
    /// Get all cities
    /// </summary>
    [HttpGet("cities")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllCities(CancellationToken cancellationToken)
    {
        var result = await _locationService.GetAllCitiesAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get cities by municipality
    /// </summary>
    [HttpGet("municipalities/{municipalityId:int}/cities")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CityDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCitiesByMunicipality(int municipalityId, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetCitiesByMunicipalityAsync(municipalityId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get city by ID
    /// </summary>
    [HttpGet("cities/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<CityDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCityById(int id, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetCityByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Search cities by name
    /// </summary>
    [HttpGet("cities/search")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<CitySummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SearchCities([FromQuery] string searchTerm, CancellationToken cancellationToken)
    {
        var result = await _locationService.SearchCitiesAsync(searchTerm, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Hierarchy

    /// <summary>
    /// Get full location hierarchy (all entities with cantons, municipalities, and cities)
    /// </summary>
    [HttpGet("hierarchy")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<LocationHierarchyDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFullHierarchy(CancellationToken cancellationToken)
    {
        var result = await _locationService.GetFullHierarchyAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get location hierarchy for a specific entity
    /// </summary>
    [HttpGet("entities/{entityId:int}/hierarchy")]
    [ProducesResponseType(typeof(ApiResponse<LocationHierarchyDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<LocationHierarchyDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetHierarchyByEntity(int entityId, CancellationToken cancellationToken)
    {
        var result = await _locationService.GetHierarchyByEntityAsync(entityId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion
}
