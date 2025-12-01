using Application.DTOs.Auth;
using Application.DTOs.Common;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Identity;

/// <summary>
/// User management service implementation
/// </summary>
public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UserService> _logger;

    public UserService(UserManager<ApplicationUser> userManager, ILogger<UserService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<ApiResponse<UserDto>> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<UserDto>.Fail("User not found.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        return ApiResponse<UserDto>.Ok(MapToDto(user, roles));
    }

    public async Task<ApiResponse<IEnumerable<UserDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var users = await _userManager.Users.ToListAsync(cancellationToken);
        var userDtos = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(MapToDto(user, roles));
        }

        return ApiResponse<IEnumerable<UserDto>>.Ok(userDtos);
    }

    public async Task<PagedResponse<UserDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? role = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(u =>
                u.Email!.ToLower().Contains(search) ||
                u.FirstName.ToLower().Contains(search) ||
                u.LastName.ToLower().Contains(search));
        }

        if (activeOnly.HasValue)
        {
            query = query.Where(u => u.IsActive == activeOnly.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var users = await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var userDtos = new List<UserDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            
            // Filter by role if specified
            if (!string.IsNullOrWhiteSpace(role) && !roles.Contains(role))
                continue;
                
            userDtos.Add(MapToDto(user, roles));
        }

        return PagedResponse<UserDto>.Create(userDtos, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<UserDto>> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return ApiResponse<UserDto>.Fail("A user with this email already exists.");
        }

        var user = new ApplicationUser
        {
            Email = request.Email,
            UserName = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            MiddleName = request.MiddleName,
            PhoneNumber = request.PhoneNumber,
            DateOfBirth = request.DateOfBirth,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<UserDto>.Fail("Failed to create user.", errors);
        }

        // Assign roles
        if (request.Roles.Any())
        {
            await _userManager.AddToRolesAsync(user, request.Roles);
        }
        else
        {
            await _userManager.AddToRoleAsync(user, "User");
        }

        var roles = await _userManager.GetRolesAsync(user);
        _logger.LogInformation("User {Email} created by admin", request.Email);
        return ApiResponse<UserDto>.Ok(MapToDto(user, roles), "User created successfully");
    }

    public async Task<ApiResponse<UserDto>> UpdateAsync(string id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<UserDto>.Fail("User not found.");
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.MiddleName = request.MiddleName;
        user.PhoneNumber = request.PhoneNumber;
        user.DateOfBirth = request.DateOfBirth;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<UserDto>.Fail("Failed to update user.", errors);
        }

        // Update roles
        var currentRoles = await _userManager.GetRolesAsync(user);
        var rolesToRemove = currentRoles.Except(request.Roles);
        var rolesToAdd = request.Roles.Except(currentRoles);

        await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
        await _userManager.AddToRolesAsync(user, rolesToAdd);

        var roles = await _userManager.GetRolesAsync(user);
        _logger.LogInformation("User {UserId} updated by admin", id);
        return ApiResponse<UserDto>.Ok(MapToDto(user, roles), "User updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<bool>.Fail("User not found.");
        }

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<bool>.Fail("Failed to delete user.", errors);
        }

        _logger.LogInformation("User {UserId} deleted", id);
        return ApiResponse<bool>.Ok(true, "User deleted successfully");
    }

    public async Task<ApiResponse<bool>> ActivateAsync(string id, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<bool>.Fail("User not found.");
        }

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("User {UserId} activated", id);
        return ApiResponse<bool>.Ok(true, "User activated successfully");
    }

    public async Task<ApiResponse<bool>> DeactivateAsync(string id, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return ApiResponse<bool>.Fail("User not found.");
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("User {UserId} deactivated", id);
        return ApiResponse<bool>.Ok(true, "User deactivated successfully");
    }

    public async Task<ApiResponse<bool>> AssignRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<bool>.Fail("User not found.");
        }

        var result = await _userManager.AddToRoleAsync(user, roleName);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<bool>.Fail("Failed to assign role.", errors);
        }

        _logger.LogInformation("Role {Role} assigned to user {UserId}", roleName, userId);
        return ApiResponse<bool>.Ok(true, $"Role '{roleName}' assigned successfully");
    }

    public async Task<ApiResponse<bool>> RemoveRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<bool>.Fail("User not found.");
        }

        var result = await _userManager.RemoveFromRoleAsync(user, roleName);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<bool>.Fail("Failed to remove role.", errors);
        }

        _logger.LogInformation("Role {Role} removed from user {UserId}", roleName, userId);
        return ApiResponse<bool>.Ok(true, $"Role '{roleName}' removed successfully");
    }

    public async Task<ApiResponse<IEnumerable<string>>> GetRolesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<IEnumerable<string>>.Fail("User not found.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        return ApiResponse<IEnumerable<string>>.Ok(roles);
    }

    private static UserDto MapToDto(ApplicationUser user, IList<string> roles)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FirstName = user.FirstName,
            LastName = user.LastName,
            MiddleName = user.MiddleName,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            DateOfBirth = user.DateOfBirth,
            IsActive = user.IsActive,
            Roles = roles.ToList()
        };
    }
}
