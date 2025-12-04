using Application.DTOs.Common;
using Application.DTOs.FeatureFlags;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Application.Services;

/// <summary>
/// Feature flag service implementation
/// </summary>
public class FeatureFlagService : IFeatureFlagService
{
    private readonly IFeatureFlagRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<FeatureFlagService> _logger;

    public FeatureFlagService(
        IFeatureFlagRepository repository,
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IHttpContextAccessor httpContextAccessor,
        ILogger<FeatureFlagService> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    private string GetCurrentUser()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier) 
            ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email) 
            ?? "system";
    }

    #region System Flag Operations

    public async Task<ApiResponse<SystemFeatureFlagDto>> GetSystemFlagByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var flag = await _repository.GetSystemFlagByIdAsync(id, cancellationToken);
            if (flag == null)
            {
                return ApiResponse<SystemFeatureFlagDto>.Fail($"System flag with ID {id} not found");
            }

            var dto = _mapper.Map<SystemFeatureFlagDto>(flag);
            dto.ClientOverrideCount = await _repository.CountClientOverridesAsync(id, cancellationToken);
            return ApiResponse<SystemFeatureFlagDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system flag by ID {Id}", id);
            return ApiResponse<SystemFeatureFlagDto>.Fail("An error occurred while retrieving the system flag");
        }
    }

    public async Task<ApiResponse<SystemFeatureFlagDto>> GetSystemFlagByKeyAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var flag = await _repository.GetSystemFlagByKeyAsync(key, cancellationToken);
            if (flag == null)
            {
                return ApiResponse<SystemFeatureFlagDto>.Fail($"System flag with key '{key}' not found");
            }

            var dto = _mapper.Map<SystemFeatureFlagDto>(flag);
            dto.ClientOverrideCount = await _repository.CountClientOverridesAsync(flag.Id, cancellationToken);
            return ApiResponse<SystemFeatureFlagDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system flag by key {Key}", key);
            return ApiResponse<SystemFeatureFlagDto>.Fail("An error occurred while retrieving the system flag");
        }
    }

    public async Task<ApiResponse<IEnumerable<SystemFeatureFlagDto>>> GetAllSystemFlagsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var flags = await _repository.GetAllSystemFlagsAsync(cancellationToken);
            var dtos = new List<SystemFeatureFlagDto>();

            foreach (var flag in flags)
            {
                var dto = _mapper.Map<SystemFeatureFlagDto>(flag);
                dto.ClientOverrideCount = await _repository.CountClientOverridesAsync(flag.Id, cancellationToken);
                dtos.Add(dto);
            }

            return ApiResponse<IEnumerable<SystemFeatureFlagDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all system flags");
            return ApiResponse<IEnumerable<SystemFeatureFlagDto>>.Fail("An error occurred while retrieving system flags");
        }
    }

    public async Task<ApiResponse<IEnumerable<SystemFeatureFlagDto>>> GetSystemFlagsByCategoryAsync(FlagCategory category, CancellationToken cancellationToken = default)
    {
        try
        {
            var flags = await _repository.GetSystemFlagsByCategoryAsync(category, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<SystemFeatureFlagDto>>(flags);
            return ApiResponse<IEnumerable<SystemFeatureFlagDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system flags by category {Category}", category);
            return ApiResponse<IEnumerable<SystemFeatureFlagDto>>.Fail("An error occurred while retrieving system flags");
        }
    }

    public async Task<ApiResponse<SystemFeatureFlagDto>> CreateSystemFlagAsync(CreateSystemFlagDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if key already exists
            if (await _repository.SystemFlagExistsAsync(dto.Key, cancellationToken))
            {
                return ApiResponse<SystemFeatureFlagDto>.Fail($"A system flag with key '{dto.Key}' already exists");
            }

            var flag = new SystemFeatureFlag
            {
                Key = dto.Key.Trim().ToLowerInvariant(),
                Name = dto.Name,
                Description = dto.Description,
                Category = dto.Category,
                Type = dto.Type,
                Value = dto.Value,
                DefaultValue = dto.DefaultValue,
                IsEnabled = dto.IsEnabled,
                AllowClientOverride = dto.AllowClientOverride,
                Environment = dto.Environment,
                CreatedBy = GetCurrentUser()
            };

            await _repository.AddSystemFlagAsync(flag, cancellationToken);
            
            // Add history entry
            await _repository.AddHistoryEntryAsync(new FeatureFlagHistory
            {
                SystemFlagId = flag.Id,
                ChangeType = "Created",
                NewValue = dto.Value,
                ChangedBy = GetCurrentUser(),
                Notes = $"Created system flag '{flag.Name}'"
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created system flag {Key} by {User}", flag.Key, GetCurrentUser());
            return ApiResponse<SystemFeatureFlagDto>.Ok(_mapper.Map<SystemFeatureFlagDto>(flag), "System flag created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating system flag");
            return ApiResponse<SystemFeatureFlagDto>.Fail("An error occurred while creating the system flag");
        }
    }

    public async Task<ApiResponse<SystemFeatureFlagDto>> UpdateSystemFlagAsync(int id, UpdateSystemFlagDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var flag = await _repository.GetSystemFlagByIdAsync(id, cancellationToken);
            if (flag == null)
            {
                return ApiResponse<SystemFeatureFlagDto>.Fail($"System flag with ID {id} not found");
            }

            var oldValue = flag.Value;
            var wasEnabled = flag.IsEnabled;

            // Update only provided fields
            if (dto.Name != null) flag.Name = dto.Name;
            if (dto.Description != null) flag.Description = dto.Description;
            if (dto.Category.HasValue) flag.Category = dto.Category.Value;
            if (dto.Type.HasValue) flag.Type = dto.Type.Value;
            if (dto.Value != null) flag.Value = dto.Value;
            if (dto.DefaultValue != null) flag.DefaultValue = dto.DefaultValue;
            if (dto.IsEnabled.HasValue) flag.IsEnabled = dto.IsEnabled.Value;
            if (dto.AllowClientOverride.HasValue) flag.AllowClientOverride = dto.AllowClientOverride.Value;
            if (dto.Environment != null) flag.Environment = dto.Environment;
            flag.UpdatedBy = GetCurrentUser();

            await _repository.UpdateSystemFlagAsync(flag, cancellationToken);

            // Add history entry
            var changeType = wasEnabled != flag.IsEnabled 
                ? (flag.IsEnabled ? "Enabled" : "Disabled") 
                : "Updated";

            await _repository.AddHistoryEntryAsync(new FeatureFlagHistory
            {
                SystemFlagId = flag.Id,
                ChangeType = changeType,
                OldValue = oldValue,
                NewValue = flag.Value,
                ChangedBy = GetCurrentUser(),
                Notes = $"Updated system flag '{flag.Name}'"
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated system flag {Id} by {User}", id, GetCurrentUser());
            return ApiResponse<SystemFeatureFlagDto>.Ok(_mapper.Map<SystemFeatureFlagDto>(flag), "System flag updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating system flag {Id}", id);
            return ApiResponse<SystemFeatureFlagDto>.Fail("An error occurred while updating the system flag");
        }
    }

    public async Task<ApiResponse<bool>> DeleteSystemFlagAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var flag = await _repository.GetSystemFlagByIdAsync(id, cancellationToken);
            if (flag == null)
            {
                return ApiResponse<bool>.Fail($"System flag with ID {id} not found");
            }

            // Check for client overrides
            var overrideCount = await _repository.CountClientOverridesAsync(id, cancellationToken);
            if (overrideCount > 0)
            {
                return ApiResponse<bool>.Fail($"Cannot delete system flag with {overrideCount} client override(s). Remove overrides first.");
            }

            await _repository.DeleteSystemFlagAsync(flag, cancellationToken);

            // Add history entry
            await _repository.AddHistoryEntryAsync(new FeatureFlagHistory
            {
                ChangeType = "Deleted",
                OldValue = flag.Value,
                ChangedBy = GetCurrentUser(),
                Notes = $"Deleted system flag '{flag.Name}' (key: {flag.Key})"
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted system flag {Id} by {User}", id, GetCurrentUser());
            return ApiResponse<bool>.Ok(true, "System flag deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting system flag {Id}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the system flag");
        }
    }

    public async Task<ApiResponse<bool>> ToggleSystemFlagAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var flag = await _repository.GetSystemFlagByIdAsync(id, cancellationToken);
            if (flag == null)
            {
                return ApiResponse<bool>.Fail($"System flag with ID {id} not found");
            }

            flag.IsEnabled = !flag.IsEnabled;
            flag.UpdatedBy = GetCurrentUser();

            await _repository.UpdateSystemFlagAsync(flag, cancellationToken);

            await _repository.AddHistoryEntryAsync(new FeatureFlagHistory
            {
                SystemFlagId = flag.Id,
                ChangeType = flag.IsEnabled ? "Enabled" : "Disabled",
                ChangedBy = GetCurrentUser(),
                Notes = $"{(flag.IsEnabled ? "Enabled" : "Disabled")} system flag '{flag.Name}'"
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Toggled system flag {Id} to {State} by {User}", id, flag.IsEnabled, GetCurrentUser());
            return ApiResponse<bool>.Ok(flag.IsEnabled, $"System flag {(flag.IsEnabled ? "enabled" : "disabled")} successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling system flag {Id}", id);
            return ApiResponse<bool>.Fail("An error occurred while toggling the system flag");
        }
    }

    #endregion

    #region Client Override Operations

    public async Task<ApiResponse<ClientFeatureFlagDto>> GetClientOverrideAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var clientFlag = await _repository.GetClientFlagByIdAsync(id, cancellationToken);
            if (clientFlag == null)
            {
                return ApiResponse<ClientFeatureFlagDto>.Fail($"Client override with ID {id} not found");
            }

            var dto = _mapper.Map<ClientFeatureFlagDto>(clientFlag);
            return ApiResponse<ClientFeatureFlagDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting client override by ID {Id}", id);
            return ApiResponse<ClientFeatureFlagDto>.Fail("An error occurred while retrieving the client override");
        }
    }

    public async Task<ApiResponse<IEnumerable<ClientFeatureFlagDto>>> GetClientOverridesForCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        try
        {
            var clientFlags = await _repository.GetClientFlagsForCustomerAsync(customerId, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<ClientFeatureFlagDto>>(clientFlags);
            return ApiResponse<IEnumerable<ClientFeatureFlagDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting client overrides for customer {CustomerId}", customerId);
            return ApiResponse<IEnumerable<ClientFeatureFlagDto>>.Fail("An error occurred while retrieving client overrides");
        }
    }

    public async Task<ApiResponse<IEnumerable<ClientFeatureFlagDto>>> GetClientOverridesForFlagAsync(int systemFlagId, CancellationToken cancellationToken = default)
    {
        try
        {
            var clientFlags = await _repository.GetClientOverridesForFlagAsync(systemFlagId, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<ClientFeatureFlagDto>>(clientFlags);
            return ApiResponse<IEnumerable<ClientFeatureFlagDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting client overrides for flag {SystemFlagId}", systemFlagId);
            return ApiResponse<IEnumerable<ClientFeatureFlagDto>>.Fail("An error occurred while retrieving client overrides");
        }
    }

    public async Task<ApiResponse<IEnumerable<ClientFeatureFlagDto>>> GetAllClientOverridesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var clientFlags = await _repository.GetAllClientFlagsAsync(cancellationToken);
            var dtos = _mapper.Map<IEnumerable<ClientFeatureFlagDto>>(clientFlags);
            return ApiResponse<IEnumerable<ClientFeatureFlagDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all client overrides");
            return ApiResponse<IEnumerable<ClientFeatureFlagDto>>.Fail("An error occurred while retrieving client overrides");
        }
    }

    public async Task<ApiResponse<ClientFeatureFlagDto>> SetClientOverrideAsync(SetClientOverrideDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Verify system flag exists and allows client override
            var systemFlag = await _repository.GetSystemFlagByIdAsync(dto.SystemFlagId, cancellationToken);
            if (systemFlag == null)
            {
                return ApiResponse<ClientFeatureFlagDto>.Fail($"System flag with ID {dto.SystemFlagId} not found");
            }

            if (!systemFlag.AllowClientOverride)
            {
                return ApiResponse<ClientFeatureFlagDto>.Fail($"System flag '{systemFlag.Name}' does not allow client overrides");
            }

            // Check if override already exists
            var existingOverride = await _repository.GetClientFlagAsync(dto.CustomerId, dto.SystemFlagId, cancellationToken);
            
            if (existingOverride != null)
            {
                // Update existing override
                var oldValue = existingOverride.Value;
                existingOverride.Value = dto.Value;
                existingOverride.IsEnabled = dto.IsEnabled;
                existingOverride.Reason = dto.Reason;
                existingOverride.ExpiresAt = dto.ExpiresAt;
                existingOverride.UpdatedBy = GetCurrentUser();

                await _repository.UpdateClientFlagAsync(existingOverride, cancellationToken);

                await _repository.AddHistoryEntryAsync(new FeatureFlagHistory
                {
                    SystemFlagId = dto.SystemFlagId,
                    ClientFlagId = existingOverride.Id,
                    CustomerId = dto.CustomerId,
                    ChangeType = "Updated",
                    OldValue = oldValue,
                    NewValue = dto.Value,
                    ChangedBy = GetCurrentUser(),
                    Notes = dto.Reason ?? "Updated client override"
                }, cancellationToken);

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Updated client override for customer {CustomerId}, flag {FlagId} by {User}", 
                    dto.CustomerId, dto.SystemFlagId, GetCurrentUser());
                return ApiResponse<ClientFeatureFlagDto>.Ok(_mapper.Map<ClientFeatureFlagDto>(existingOverride), "Client override updated successfully");
            }
            else
            {
                // Create new override
                var clientFlag = new ClientFeatureFlag
                {
                    CustomerId = dto.CustomerId,
                    SystemFlagId = dto.SystemFlagId,
                    Value = dto.Value,
                    IsEnabled = dto.IsEnabled,
                    Reason = dto.Reason,
                    ExpiresAt = dto.ExpiresAt,
                    CreatedBy = GetCurrentUser()
                };

                await _repository.AddClientFlagAsync(clientFlag, cancellationToken);

                await _repository.AddHistoryEntryAsync(new FeatureFlagHistory
                {
                    SystemFlagId = dto.SystemFlagId,
                    ClientFlagId = clientFlag.Id,
                    CustomerId = dto.CustomerId,
                    ChangeType = "Created",
                    NewValue = dto.Value,
                    ChangedBy = GetCurrentUser(),
                    Notes = dto.Reason ?? "Created client override"
                }, cancellationToken);

                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Created client override for customer {CustomerId}, flag {FlagId} by {User}", 
                    dto.CustomerId, dto.SystemFlagId, GetCurrentUser());
                return ApiResponse<ClientFeatureFlagDto>.Ok(_mapper.Map<ClientFeatureFlagDto>(clientFlag), "Client override created successfully");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting client override");
            return ApiResponse<ClientFeatureFlagDto>.Fail("An error occurred while setting the client override");
        }
    }

    public async Task<ApiResponse<bool>> RemoveClientOverrideAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var clientFlag = await _repository.GetClientFlagByIdAsync(id, cancellationToken);
            if (clientFlag == null)
            {
                return ApiResponse<bool>.Fail($"Client override with ID {id} not found");
            }

            await _repository.DeleteClientFlagAsync(clientFlag, cancellationToken);

            await _repository.AddHistoryEntryAsync(new FeatureFlagHistory
            {
                SystemFlagId = clientFlag.SystemFlagId,
                CustomerId = clientFlag.CustomerId,
                ChangeType = "Deleted",
                OldValue = clientFlag.Value,
                ChangedBy = GetCurrentUser(),
                Notes = "Removed client override"
            }, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Removed client override {Id} by {User}", id, GetCurrentUser());
            return ApiResponse<bool>.Ok(true, "Client override removed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing client override {Id}", id);
            return ApiResponse<bool>.Fail("An error occurred while removing the client override");
        }
    }

    public async Task<ApiResponse<bool>> RemoveClientOverrideAsync(int customerId, int systemFlagId, CancellationToken cancellationToken = default)
    {
        try
        {
            var clientFlag = await _repository.GetClientFlagAsync(customerId, systemFlagId, cancellationToken);
            if (clientFlag == null)
            {
                return ApiResponse<bool>.Fail("Client override not found");
            }

            return await RemoveClientOverrideAsync(clientFlag.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing client override for customer {CustomerId}, flag {FlagId}", customerId, systemFlagId);
            return ApiResponse<bool>.Fail("An error occurred while removing the client override");
        }
    }

    public async Task<ApiResponse<int>> CleanupExpiredOverridesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _repository.CleanupExpiredOverridesAsync(cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Cleaned up expired client overrides");
            return ApiResponse<int>.Ok(0, "Expired overrides cleaned up");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up expired overrides");
            return ApiResponse<int>.Fail("An error occurred while cleaning up expired overrides");
        }
    }

    #endregion

    #region Flag Evaluation

    public async Task<ApiResponse<EvaluatedFlagDto>> EvaluateFlagAsync(string key, int? customerId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var systemFlag = await _repository.GetSystemFlagByKeyAsync(key, cancellationToken);
            if (systemFlag == null)
            {
                return ApiResponse<EvaluatedFlagDto>.Fail($"Flag with key '{key}' not found");
            }

            var evaluatedFlag = new EvaluatedFlagDto
            {
                Key = systemFlag.Key,
                Name = systemFlag.Name,
                Type = systemFlag.Type,
                Value = systemFlag.Value,
                IsEnabled = systemFlag.IsEnabled,
                Source = FlagScope.System,
                HasClientOverride = false
            };

            // Check for client override if customerId provided and system flag allows overrides
            if (customerId.HasValue && systemFlag.AllowClientOverride)
            {
                var clientOverride = await _repository.GetClientFlagAsync(customerId.Value, systemFlag.Id, cancellationToken);
                if (clientOverride != null && clientOverride.IsEnabled)
                {
                    // Check if not expired
                    if (!clientOverride.ExpiresAt.HasValue || clientOverride.ExpiresAt > DateTime.UtcNow)
                    {
                        evaluatedFlag.Value = clientOverride.Value;
                        evaluatedFlag.IsEnabled = clientOverride.IsEnabled;
                        evaluatedFlag.Source = FlagScope.Client;
                        evaluatedFlag.HasClientOverride = true;
                    }
                }
            }

            return ApiResponse<EvaluatedFlagDto>.Ok(evaluatedFlag);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating flag {Key}", key);
            return ApiResponse<EvaluatedFlagDto>.Fail("An error occurred while evaluating the flag");
        }
    }

    public async Task<ApiResponse<EvaluateFlagsResponseDto>> EvaluateFlagsAsync(EvaluateFlagsRequestDto request, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = new EvaluateFlagsResponseDto
            {
                CustomerId = request.CustomerId,
                EvaluatedAt = DateTime.UtcNow
            };

            IReadOnlyList<SystemFeatureFlag> systemFlags;
            
            if (request.FlagKeys != null && request.FlagKeys.Any())
            {
                // Get specific flags
                var flags = new List<SystemFeatureFlag>();
                foreach (var key in request.FlagKeys)
                {
                    var flag = await _repository.GetSystemFlagByKeyAsync(key, cancellationToken);
                    if (flag != null)
                    {
                        // Filter by environment if specified
                        if (string.IsNullOrEmpty(request.Environment) || 
                            string.IsNullOrEmpty(flag.Environment) || 
                            flag.Environment == request.Environment)
                        {
                            flags.Add(flag);
                        }
                    }
                }
                systemFlags = flags;
            }
            else
            {
                // Get all flags, optionally filtered by environment
                systemFlags = string.IsNullOrEmpty(request.Environment)
                    ? await _repository.GetAllSystemFlagsAsync(cancellationToken)
                    : await _repository.GetSystemFlagsByEnvironmentAsync(request.Environment, cancellationToken);
            }

            foreach (var systemFlag in systemFlags)
            {
                var evaluatedFlag = new EvaluatedFlagDto
                {
                    Key = systemFlag.Key,
                    Name = systemFlag.Name,
                    Type = systemFlag.Type,
                    Value = systemFlag.Value,
                    IsEnabled = systemFlag.IsEnabled,
                    Source = FlagScope.System,
                    HasClientOverride = false
                };

                // Check for client override
                if (request.CustomerId.HasValue && systemFlag.AllowClientOverride)
                {
                    var clientOverride = await _repository.GetClientFlagAsync(request.CustomerId.Value, systemFlag.Id, cancellationToken);
                    if (clientOverride != null && clientOverride.IsEnabled)
                    {
                        if (!clientOverride.ExpiresAt.HasValue || clientOverride.ExpiresAt > DateTime.UtcNow)
                        {
                            evaluatedFlag.Value = clientOverride.Value;
                            evaluatedFlag.IsEnabled = clientOverride.IsEnabled;
                            evaluatedFlag.Source = FlagScope.Client;
                            evaluatedFlag.HasClientOverride = true;
                        }
                    }
                }

                response.Flags.Add(evaluatedFlag);
            }

            return ApiResponse<EvaluateFlagsResponseDto>.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating flags");
            return ApiResponse<EvaluateFlagsResponseDto>.Fail("An error occurred while evaluating flags");
        }
    }

    public async Task<ApiResponse<bool>> IsFlagEnabledAsync(string key, int? customerId = null, CancellationToken cancellationToken = default)
    {
        var result = await EvaluateFlagAsync(key, customerId, cancellationToken);
        if (!result.Success)
        {
            return ApiResponse<bool>.Fail(result.Message ?? "Flag not found");
        }

        // For boolean flags, parse the value; otherwise return IsEnabled
        if (result.Data!.Type == FlagType.Boolean)
        {
            var isEnabled = result.Data.IsEnabled && 
                bool.TryParse(result.Data.Value, out var value) && value;
            return ApiResponse<bool>.Ok(isEnabled);
        }

        return ApiResponse<bool>.Ok(result.Data.IsEnabled);
    }

    public async Task<ApiResponse<string>> GetFlagValueAsync(string key, int? customerId = null, CancellationToken cancellationToken = default)
    {
        var result = await EvaluateFlagAsync(key, customerId, cancellationToken);
        if (!result.Success)
        {
            return ApiResponse<string>.Fail(result.Message ?? "Flag not found");
        }

        return ApiResponse<string>.Ok(result.Data!.Value);
    }

    #endregion

    #region History & Statistics

    public async Task<ApiResponse<IEnumerable<FeatureFlagHistoryDto>>> GetHistoryAsync(int? systemFlagId = null, int take = 50, CancellationToken cancellationToken = default)
    {
        try
        {
            IReadOnlyList<FeatureFlagHistory> history;
            
            if (systemFlagId.HasValue)
            {
                history = await _repository.GetHistoryForSystemFlagAsync(systemFlagId.Value, take, cancellationToken);
            }
            else
            {
                history = await _repository.GetRecentHistoryAsync(take, cancellationToken);
            }

            var dtos = _mapper.Map<IEnumerable<FeatureFlagHistoryDto>>(history);
            return ApiResponse<IEnumerable<FeatureFlagHistoryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting flag history");
            return ApiResponse<IEnumerable<FeatureFlagHistoryDto>>.Fail("An error occurred while retrieving flag history");
        }
    }

    public async Task<ApiResponse<FeatureFlagStatsDto>> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var totalSystemFlags = await _repository.CountSystemFlagsAsync(cancellationToken);
            var enabledSystemFlags = await _repository.CountEnabledSystemFlagsAsync(cancellationToken);
            var activeClientOverrides = await _repository.CountActiveClientOverridesAsync(cancellationToken);
            var flagsByCategory = await _repository.GetFlagCountByCategoryAsync(cancellationToken);

            var stats = new FeatureFlagStatsDto
            {
                TotalSystemFlags = totalSystemFlags,
                EnabledSystemFlags = enabledSystemFlags,
                DisabledSystemFlags = totalSystemFlags - enabledSystemFlags,
                TotalClientOverrides = activeClientOverrides,
                ActiveClientOverrides = activeClientOverrides,
                FlagsByCategory = flagsByCategory
            };

            return ApiResponse<FeatureFlagStatsDto>.Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting flag statistics");
            return ApiResponse<FeatureFlagStatsDto>.Fail("An error occurred while retrieving statistics");
        }
    }

    #endregion
}
