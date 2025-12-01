using Application.DTOs.Common;
using Application.DTOs.Customers;
using Domain.Enums;

namespace Application.Interfaces;

/// <summary>
/// Customer service interface
/// </summary>
public interface ICustomerService
{
    Task<ApiResponse<CustomerDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDto>> GetByCodeAsync(string customerCode, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CustomerDto>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<PagedResponse<CustomerSummaryDto>> GetPagedAsync(
        int page, 
        int pageSize, 
        string? search = null, 
        CustomerType? customerType = null, 
        CustomerTier? tier = null, 
        bool? activeOnly = true, 
        CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CustomerSummaryDto>>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDto>> CreateAsync(CreateCustomerDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDto>> UpdateAsync(int id, UpdateCustomerDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ActivateAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeactivateAsync(int id, CancellationToken cancellationToken = default);
    
    // Address operations
    Task<ApiResponse<CustomerAddressDto>> GetAddressByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CustomerAddressDto>>> GetAddressesByCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerAddressDto>> CreateAddressAsync(int customerId, CreateCustomerAddressDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerAddressDto>> UpdateAddressAsync(int id, UpdateCustomerAddressDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAddressAsync(int id, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> SetDefaultAddressAsync(int customerId, int addressId, CancellationToken cancellationToken = default);
}
