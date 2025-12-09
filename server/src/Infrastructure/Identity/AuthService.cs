using Application.DTOs.Auth;
using Application.DTOs.Common;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Identity;

/// <summary>
/// Authentication service implementation
/// </summary>
public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ApplicationDbContext context,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _context = context;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            _logger.LogWarning("Login failed: User not found for email {Email}", request.Email);
            return AuthResponse.Failure("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login failed: User {Email} is deactivated", request.Email);
            return AuthResponse.Failure("Your account has been deactivated. Please contact support.");
        }

        var isValidPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValidPassword)
        {
            _logger.LogWarning("Login failed: Invalid password for user {Email}", request.Email);
            return AuthResponse.Failure("Invalid email or password.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        
        // Get permissions for user's roles
        var permissions = await GetPermissionsForRolesAsync(roles);
        
        var (accessToken, refreshToken, expiresAt) = await _tokenService.GenerateTokensAsync(
            user.Id, 
            roles, 
            user.CustomerId, 
            permissions);

        var userDto = MapToUserDto(user, roles, permissions);

        _logger.LogInformation("User {Email} logged in successfully", request.Email);
        return AuthResponse.Success(accessToken, refreshToken, expiresAt, userDto, "Login successful");
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return AuthResponse.Failure("A user with this email already exists.");
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
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return AuthResponse.Failure("Registration failed.", errors);
        }

        // Assign default role
        await _userManager.AddToRoleAsync(user, "User");

        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await GetPermissionsForRolesAsync(roles);
        var (accessToken, refreshToken, expiresAt) = await _tokenService.GenerateTokensAsync(
            user.Id, 
            roles, 
            user.CustomerId, 
            permissions);

        var userDto = MapToUserDto(user, roles, permissions);

        _logger.LogInformation("User {Email} registered successfully", request.Email);
        return AuthResponse.Success(accessToken, refreshToken, expiresAt, userDto, "Registration successful");
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        // Validate the refresh token
        var userId = await _tokenService.ValidateRefreshTokenAsync(GetUserIdFromToken(request.AccessToken), request.RefreshToken);
        if (userId == null)
        {
            return AuthResponse.Failure("Invalid or expired refresh token.");
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || !user.IsActive)
        {
            return AuthResponse.Failure("User not found or deactivated.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await GetPermissionsForRolesAsync(roles);
        var (accessToken, refreshToken, expiresAt) = await _tokenService.GenerateTokensAsync(
            user.Id, 
            roles, 
            user.CustomerId, 
            permissions);

        var userDto = MapToUserDto(user, roles, permissions);

        return AuthResponse.Success(accessToken, refreshToken, expiresAt, userDto, "Token refreshed successfully");
    }

    public async Task<ApiResponse<bool>> LogoutAsync(string userId, CancellationToken cancellationToken = default)
    {
        await _tokenService.RevokeRefreshTokenAsync(userId);
        _logger.LogInformation("User {UserId} logged out", userId);
        return ApiResponse<bool>.Ok(true, "Logout successful");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<bool>.Fail("User not found.");
        }

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<bool>.Fail("Failed to change password.", errors);
        }

        // Revoke all refresh tokens after password change
        await _tokenService.RevokeRefreshTokenAsync(userId);

        _logger.LogInformation("User {UserId} changed password", userId);
        return ApiResponse<bool>.Ok(true, "Password changed successfully. Please log in again.");
    }

    public async Task<ApiResponse<bool>> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            // Don't reveal that the user doesn't exist
            return ApiResponse<bool>.Ok(true, "If the email exists, a password reset link has been sent.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        
        // TODO: Send email with reset token
        _logger.LogInformation("Password reset token generated for user {Email}", request.Email);
        
        return ApiResponse<bool>.Ok(true, "If the email exists, a password reset link has been sent.");
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return ApiResponse<bool>.Fail("Invalid reset request.");
        }

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<bool>.Fail("Failed to reset password.", errors);
        }

        // Revoke all refresh tokens
        await _tokenService.RevokeRefreshTokenAsync(user.Id);

        _logger.LogInformation("User {Email} reset password", request.Email);
        return ApiResponse<bool>.Ok(true, "Password reset successfully. Please log in with your new password.");
    }

    public async Task<ApiResponse<UserDto>> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<UserDto>.Fail("User not found.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await GetPermissionsForRolesAsync(roles);
        var userDto = MapToUserDto(user, roles, permissions);

        return ApiResponse<UserDto>.Ok(userDto);
    }

    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(string userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return ApiResponse<UserDto>.Fail("User not found.");
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.MiddleName = request.MiddleName;
        user.PhoneNumber = request.PhoneNumber;
        user.DateOfBirth = request.DateOfBirth;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return ApiResponse<UserDto>.Fail("Failed to update profile.", errors);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await GetPermissionsForRolesAsync(roles);
        var userDto = MapToUserDto(user, roles, permissions);

        _logger.LogInformation("User {UserId} updated profile", userId);
        return ApiResponse<UserDto>.Ok(userDto, "Profile updated successfully");
    }

    private async Task<List<string>> GetPermissionsForRolesAsync(IEnumerable<string> roleNames)
    {
        var permissions = await _context.RolePermissions
            .Include(rp => rp.Permission)
            .Include(rp => rp.Role)
            .Where(rp => roleNames.Contains(rp.Role.Name!) && rp.Permission.IsActive)
            .Select(rp => rp.Permission.Key)
            .Distinct()
            .ToListAsync();

        return permissions;
    }

    private static UserDto MapToUserDto(ApplicationUser user, IList<string> roles, IEnumerable<string>? permissions = null)
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
            Roles = roles.ToList(),
            CustomerId = user.CustomerId,
            Permissions = permissions?.ToList() ?? new List<string>()
        };
    }

    private string GetUserIdFromToken(string accessToken)
    {
        try
        {
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var token = handler.ReadJwtToken(accessToken);
            return token.Claims.FirstOrDefault(c => c.Type == "sub")?.Value ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }
}
