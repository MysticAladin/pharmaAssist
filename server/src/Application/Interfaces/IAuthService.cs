using Application.DTOs.Auth;
using Application.DTOs.Common;

namespace Application.Interfaces;

/// <summary>
/// Authentication service interface
/// </summary>
public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> LogoutAsync(string userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
}

/// <summary>
/// User management service interface
/// </summary>
public interface IUserService
{
    Task<ApiResponse<UserDto>> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<UserDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PagedResponse<UserDto>> GetPagedAsync(int page, int pageSize, string? search = null, string? role = null, bool? activeOnly = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<UserDto>> UpdateAsync(string id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(string id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ActivateAsync(string id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeactivateAsync(string id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> AssignRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> RemoveRoleAsync(string userId, string roleName, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<string>>> GetRolesAsync(string userId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Role management service interface
/// </summary>
public interface IRoleService
{
    Task<ApiResponse<RoleDto>> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<ApiResponse<RoleDto>> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<RoleDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<RoleDto>> CreateAsync(CreateRoleRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<RoleDto>> UpdateAsync(string id, UpdateRoleRequest request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(string id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<UserDto>>> GetUsersInRoleAsync(string roleId, CancellationToken cancellationToken = default);
}

/// <summary>
/// JWT Token service interface
/// </summary>
public interface ITokenService
{
    Task<(string accessToken, string refreshToken, DateTime expiresAt)> GenerateTokensAsync(
        string userId, 
        IEnumerable<string> roles, 
        int? customerId = null, 
        IEnumerable<string>? permissions = null);
    Task<string?> ValidateRefreshTokenAsync(string userId, string refreshToken);
    Task RevokeRefreshTokenAsync(string userId);
}
