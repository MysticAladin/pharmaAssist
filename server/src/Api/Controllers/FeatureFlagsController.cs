using Application.DTOs.Common;
using Application.DTOs.FeatureFlags;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Feature Flags API Controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class FeatureFlagsController : ControllerBase
{
    private readonly IFeatureFlagService _featureFlagService;
    private readonly ILogger<FeatureFlagsController> _logger;

    public FeatureFlagsController(IFeatureFlagService featureFlagService, ILogger<FeatureFlagsController> logger)
    {
        _featureFlagService = featureFlagService;
        _logger = logger;
    }

    #region System Flags

    /// <summary>
    /// Get all system feature flags
    /// </summary>
    [HttpGet("system")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SystemFeatureFlagDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllSystemFlags(CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetAllSystemFlagsAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get system flag by ID
    /// </summary>
    [HttpGet("system/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<SystemFeatureFlagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SystemFeatureFlagDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSystemFlagById(int id, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetSystemFlagByIdAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get system flag by key
    /// </summary>
    [HttpGet("system/key/{key}")]
    [ProducesResponseType(typeof(ApiResponse<SystemFeatureFlagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SystemFeatureFlagDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSystemFlagByKey(string key, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetSystemFlagByKeyAsync(key, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get system flags by category
    /// </summary>
    [HttpGet("system/category/{category}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SystemFeatureFlagDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemFlagsByCategory(FlagCategory category, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetSystemFlagsByCategoryAsync(category, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Create a new system flag
    /// </summary>
    [HttpPost("system")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<SystemFeatureFlagDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<SystemFeatureFlagDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSystemFlag([FromBody] CreateSystemFlagDto dto, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.CreateSystemFlagAsync(dto, cancellationToken);
        return result.Success 
            ? CreatedAtAction(nameof(GetSystemFlagById), new { id = result.Data!.Id }, result) 
            : BadRequest(result);
    }

    /// <summary>
    /// Update a system flag
    /// </summary>
    [HttpPut("system/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<SystemFeatureFlagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SystemFeatureFlagDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSystemFlag(int id, [FromBody] UpdateSystemFlagDto dto, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.UpdateSystemFlagAsync(id, dto, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Delete a system flag
    /// </summary>
    [HttpDelete("system/{id:int}")]
    [Authorize(Roles = "SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSystemFlag(int id, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.DeleteSystemFlagAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Toggle a system flag's enabled state
    /// </summary>
    [HttpPost("system/{id:int}/toggle")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleSystemFlag(int id, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.ToggleSystemFlagAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region Client Overrides

    /// <summary>
    /// Get all client overrides
    /// </summary>
    [HttpGet("client")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClientFeatureFlagDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllClientOverrides(CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetAllClientOverridesAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get client override by ID
    /// </summary>
    [HttpGet("client/{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ClientFeatureFlagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClientFeatureFlagDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClientOverrideById(int id, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetClientOverrideAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get all overrides for a specific customer
    /// </summary>
    [HttpGet("client/customer/{customerId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClientFeatureFlagDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClientOverridesForCustomer(int customerId, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetClientOverridesForCustomerAsync(customerId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get all client overrides for a specific system flag
    /// </summary>
    [HttpGet("client/flag/{systemFlagId:int}")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ClientFeatureFlagDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClientOverridesForFlag(int systemFlagId, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetClientOverridesForFlagAsync(systemFlagId, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Set or update a client override
    /// </summary>
    [HttpPost("client")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ClientFeatureFlagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<ClientFeatureFlagDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetClientOverride([FromBody] SetClientOverrideDto dto, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.SetClientOverrideAsync(dto, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Remove a client override by ID
    /// </summary>
    [HttpDelete("client/{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveClientOverride(int id, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.RemoveClientOverrideAsync(id, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Remove a client override by customer and flag
    /// </summary>
    [HttpDelete("client/customer/{customerId:int}/flag/{systemFlagId:int}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveClientOverrideByCustomerAndFlag(int customerId, int systemFlagId, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.RemoveClientOverrideAsync(customerId, systemFlagId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Cleanup expired client overrides
    /// </summary>
    [HttpPost("client/cleanup")]
    [Authorize(Roles = "SuperAdmin")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CleanupExpiredOverrides(CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.CleanupExpiredOverridesAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion

    #region Flag Evaluation

    /// <summary>
    /// Evaluate a single flag for a customer
    /// </summary>
    [HttpGet("evaluate/{key}")]
    [ProducesResponseType(typeof(ApiResponse<EvaluatedFlagDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EvaluatedFlagDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EvaluateFlag(string key, [FromQuery] int? customerId, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.EvaluateFlagAsync(key, customerId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Evaluate multiple flags (bulk evaluation)
    /// </summary>
    [HttpPost("evaluate")]
    [ProducesResponseType(typeof(ApiResponse<EvaluateFlagsResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EvaluateFlags([FromBody] EvaluateFlagsRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.EvaluateFlagsAsync(request, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Check if a flag is enabled (simple boolean check)
    /// </summary>
    [HttpGet("enabled/{key}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> IsFlagEnabled(string key, [FromQuery] int? customerId, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.IsFlagEnabledAsync(key, customerId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>
    /// Get the value of a flag
    /// </summary>
    [HttpGet("value/{key}")]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFlagValue(string key, [FromQuery] int? customerId, CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetFlagValueAsync(key, customerId, cancellationToken);
        return result.Success ? Ok(result) : NotFound(result);
    }

    #endregion

    #region History & Statistics

    /// <summary>
    /// Get flag change history
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<FeatureFlagHistoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory([FromQuery] int? systemFlagId, [FromQuery] int take = 50, CancellationToken cancellationToken = default)
    {
        var result = await _featureFlagService.GetHistoryAsync(systemFlagId, take, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Get feature flag statistics
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(ApiResponse<FeatureFlagStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(CancellationToken cancellationToken)
    {
        var result = await _featureFlagService.GetStatisticsAsync(cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    #endregion
}
