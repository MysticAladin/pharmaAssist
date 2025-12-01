using Application.DTOs.Auth;
using Application.DTOs.Common;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Identity;

/// <summary>
/// Role management service implementation
/// </summary>
public class RoleService : IRoleService
{
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<RoleService> _logger;

    public RoleService(
        RoleManager<ApplicationRole> roleManager,
        UserManager<ApplicationUser> userManager,
        ILogger<RoleService> logger)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<ApiResponse<RoleDto>> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null)
        {
            return ApiResponse<RoleDto>.Fail("Role not found.");
        }

        return ApiResponse<RoleDto>.Ok(MapToDto(role));
    }

    public async Task<ApiResponse<RoleDto>> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        var role = await _roleManager.FindByNameAsync(name);
        if (role == null)
        {
            return ApiResponse<RoleDto>.Fail("Role not found.");
        }

        return ApiResponse<RoleDto>.Ok(MapToDto(role));
    }

    public async Task<ApiResponse<IEnumerable<RoleDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _roleManager.Roles.ToListAsync(cancellationToken);
        var roleDtos = roles.Select(MapToDto).ToList();
        return ApiResponse<IEnumerable<RoleDto>>.Ok(roleDtos);
    }

    public async Task<ApiResponse<RoleDto>> CreateAsync(CreateRoleRequest request, CancellationToken cancellationToken = default)
    {
        var existingRole = await _roleManager.FindByNameAsync(request.Name);
        if (existingRole != null)
        {
            return ApiResponse<RoleDto>.Fail("A role with this name already exists.");
        }

        var role = new ApplicationRole
        {
            Name = request.Name,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _roleManager.CreateAsync(role);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<RoleDto>.Fail("Failed to create role.", errors);
        }

        _logger.LogInformation("Role {RoleName} created", request.Name);
        return ApiResponse<RoleDto>.Ok(MapToDto(role), "Role created successfully");
    }

    public async Task<ApiResponse<RoleDto>> UpdateAsync(string id, UpdateRoleRequest request, CancellationToken cancellationToken = default)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null)
        {
            return ApiResponse<RoleDto>.Fail("Role not found.");
        }

        // Check if new name conflicts with another role
        if (role.Name != request.Name)
        {
            var existingRole = await _roleManager.FindByNameAsync(request.Name);
            if (existingRole != null)
            {
                return ApiResponse<RoleDto>.Fail("A role with this name already exists.");
            }
        }

        role.Name = request.Name;
        role.Description = request.Description;
        role.UpdatedAt = DateTime.UtcNow;

        var result = await _roleManager.UpdateAsync(role);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<RoleDto>.Fail("Failed to update role.", errors);
        }

        _logger.LogInformation("Role {RoleId} updated", id);
        return ApiResponse<RoleDto>.Ok(MapToDto(role), "Role updated successfully");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role == null)
        {
            return ApiResponse<bool>.Fail("Role not found.");
        }

        // Prevent deletion of system roles
        var systemRoles = new[] { "Admin", "Manager", "User" };
        if (systemRoles.Contains(role.Name, StringComparer.OrdinalIgnoreCase))
        {
            return ApiResponse<bool>.Fail("Cannot delete system roles.");
        }

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<bool>.Fail("Failed to delete role.", errors);
        }

        _logger.LogInformation("Role {RoleId} deleted", id);
        return ApiResponse<bool>.Ok(true, "Role deleted successfully");
    }

    public async Task<ApiResponse<IEnumerable<UserDto>>> GetUsersInRoleAsync(string roleId, CancellationToken cancellationToken = default)
    {
        var role = await _roleManager.FindByIdAsync(roleId);
        if (role == null)
        {
            return ApiResponse<IEnumerable<UserDto>>.Fail("Role not found.");
        }

        var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
        var userDtos = new List<UserDto>();

        foreach (var user in usersInRole)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(new UserDto
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
            });
        }

        return ApiResponse<IEnumerable<UserDto>>.Ok(userDtos);
    }

    private static RoleDto MapToDto(ApplicationRole role)
    {
        return new RoleDto
        {
            Id = role.Id,
            Name = role.Name ?? string.Empty,
            Description = role.Description
        };
    }
}
