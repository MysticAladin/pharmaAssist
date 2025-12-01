using Application.DTOs.Common;
using Application.DTOs.Customers;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Customer service implementation
/// </summary>
public class CustomerService : ICustomerService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<CustomerService> _logger;

    public CustomerService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<CustomerService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ApiResponse<CustomerDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<CustomerDto>.Fail($"Customer with ID {id} not found");
            }

            var dto = _mapper.Map<CustomerDto>(customer);
            return ApiResponse<CustomerDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customer by ID {Id}", id);
            return ApiResponse<CustomerDto>.Fail("An error occurred while retrieving the customer");
        }
    }

    public async Task<ApiResponse<CustomerDto>> GetByCodeAsync(string customerCode, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByCodeAsync(customerCode, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<CustomerDto>.Fail($"Customer with code '{customerCode}' not found");
            }

            var dto = _mapper.Map<CustomerDto>(customer);
            return ApiResponse<CustomerDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting customer by code {Code}", customerCode);
            return ApiResponse<CustomerDto>.Fail("An error occurred while retrieving the customer");
        }
    }

    public async Task<ApiResponse<IEnumerable<CustomerDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var customers = await _unitOfWork.Customers.GetAllAsync(cancellationToken);
            var dtos = _mapper.Map<IEnumerable<CustomerDto>>(customers);
            return ApiResponse<IEnumerable<CustomerDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all customers");
            return ApiResponse<IEnumerable<CustomerDto>>.Fail("An error occurred while retrieving customers");
        }
    }

    public async Task<PagedResponse<CustomerSummaryDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        CustomerType? customerType = null,
        CustomerTier? tier = null,
        bool? activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.Customers.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(c =>
                    c.FirstName.ToLower().Contains(searchLower) ||
                    c.LastName.ToLower().Contains(searchLower) ||
                    (c.CompanyName != null && c.CompanyName.ToLower().Contains(searchLower)) ||
                    (c.Email != null && c.Email.ToLower().Contains(searchLower)) ||
                    (c.Phone != null && c.Phone.Contains(search)) ||
                    (c.TaxId != null && c.TaxId.Contains(search)) ||
                    c.CustomerCode.ToLower().Contains(searchLower));
            }

            if (customerType.HasValue)
            {
                query = query.Where(c => c.CustomerType == customerType.Value);
            }

            if (tier.HasValue)
            {
                query = query.Where(c => c.Tier == tier.Value);
            }

            if (activeOnly == true)
            {
                query = query.Where(c => c.IsActive);
            }

            // Get total count
            var totalCount = query.Count();

            // Apply pagination
            var customers = query
                .OrderBy(c => c.LastName)
                .ThenBy(c => c.FirstName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var dtos = _mapper.Map<List<CustomerSummaryDto>>(customers);

            return PagedResponse<CustomerSummaryDto>.Create(dtos, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged customers");
            return PagedResponse<CustomerSummaryDto>.Create(new List<CustomerSummaryDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<IEnumerable<CustomerSummaryDto>>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        try
        {
            var customers = await _unitOfWork.Customers.SearchAsync(searchTerm, cancellationToken);
            var dtos = _mapper.Map<IEnumerable<CustomerSummaryDto>>(customers);
            return ApiResponse<IEnumerable<CustomerSummaryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching customers with term {SearchTerm}", searchTerm);
            return ApiResponse<IEnumerable<CustomerSummaryDto>>.Fail("An error occurred while searching customers");
        }
    }

    public async Task<ApiResponse<CustomerDto>> CreateAsync(CreateCustomerDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check for duplicate email
            if (!string.IsNullOrEmpty(dto.Email))
            {
                var existingByEmail = await _unitOfWork.Customers.FindAsync(
                    c => c.Email == dto.Email,
                    cancellationToken);

                if (existingByEmail.Any())
                {
                    return ApiResponse<CustomerDto>.Fail($"Customer with email '{dto.Email}' already exists");
                }
            }

            // Check for duplicate tax ID
            if (!string.IsNullOrEmpty(dto.TaxId))
            {
                var existingByTax = await _unitOfWork.Customers.FindAsync(
                    c => c.TaxId == dto.TaxId,
                    cancellationToken);

                if (existingByTax.Any())
                {
                    return ApiResponse<CustomerDto>.Fail($"Customer with tax ID '{dto.TaxId}' already exists");
                }
            }

            var customer = _mapper.Map<Customer>(dto);
            
            // Generate customer code
            customer.CustomerCode = await GenerateCustomerCodeAsync(dto.CustomerType, cancellationToken);
            
            await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created customer {CustomerId} with code {Code}", customer.Id, customer.CustomerCode);

            var resultDto = _mapper.Map<CustomerDto>(customer);
            return ApiResponse<CustomerDto>.Ok(resultDto, "Customer created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating customer with name {Name}", dto.Name);
            return ApiResponse<CustomerDto>.Fail("An error occurred while creating the customer");
        }
    }

    public async Task<ApiResponse<CustomerDto>> UpdateAsync(int id, UpdateCustomerDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<CustomerDto>.Fail($"Customer with ID {id} not found");
            }

            // Check for duplicate email if changed
            if (!string.IsNullOrEmpty(dto.Email) && dto.Email != customer.Email)
            {
                var existingByEmail = await _unitOfWork.Customers.FindAsync(
                    c => c.Email == dto.Email && c.Id != id,
                    cancellationToken);

                if (existingByEmail.Any())
                {
                    return ApiResponse<CustomerDto>.Fail($"Customer with email '{dto.Email}' already exists");
                }
            }

            // Check for duplicate tax ID if changed
            if (!string.IsNullOrEmpty(dto.TaxId) && dto.TaxId != customer.TaxId)
            {
                var existingByTax = await _unitOfWork.Customers.FindAsync(
                    c => c.TaxId == dto.TaxId && c.Id != id,
                    cancellationToken);

                if (existingByTax.Any())
                {
                    return ApiResponse<CustomerDto>.Fail($"Customer with tax ID '{dto.TaxId}' already exists");
                }
            }

            _mapper.Map(dto, customer);
            await _unitOfWork.Customers.UpdateAsync(customer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated customer {CustomerId}", id);

            var resultDto = _mapper.Map<CustomerDto>(customer);
            return ApiResponse<CustomerDto>.Ok(resultDto, "Customer updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating customer {CustomerId}", id);
            return ApiResponse<CustomerDto>.Fail("An error occurred while updating the customer");
        }
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<bool>.Fail($"Customer with ID {id} not found");
            }

            // Check for orders from this customer
            var orders = await _unitOfWork.Orders.GetByCustomerIdAsync(id, cancellationToken);
            if (orders.Any())
            {
                // Soft delete instead
                customer.IsActive = false;
                await _unitOfWork.Customers.UpdateAsync(customer, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Soft deleted customer {CustomerId} (has order history)", id);
                return ApiResponse<bool>.Ok(true, "Customer deactivated (has order history)");
            }

            await _unitOfWork.Customers.DeleteAsync(customer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted customer {CustomerId}", id);
            return ApiResponse<bool>.Ok(true, "Customer deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting customer {CustomerId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the customer");
        }
    }

    public async Task<ApiResponse<bool>> ActivateAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<bool>.Fail($"Customer with ID {id} not found");
            }

            customer.IsActive = true;
            customer.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Customers.UpdateAsync(customer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Activated customer {CustomerId}", id);
            return ApiResponse<bool>.Ok(true, "Customer activated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating customer {CustomerId}", id);
            return ApiResponse<bool>.Fail("An error occurred while activating the customer");
        }
    }

    public async Task<ApiResponse<bool>> DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<bool>.Fail($"Customer with ID {id} not found");
            }

            customer.IsActive = false;
            customer.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Customers.UpdateAsync(customer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deactivated customer {CustomerId}", id);
            return ApiResponse<bool>.Ok(true, "Customer deactivated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating customer {CustomerId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deactivating the customer");
        }
    }

    // Address operations
    public async Task<ApiResponse<CustomerAddressDto>> GetAddressByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var addresses = _unitOfWork.Customers.AsQueryable()
                .SelectMany(c => c.Addresses)
                .Where(a => a.Id == id)
                .ToList();

            var address = addresses.FirstOrDefault();
            if (address == null)
            {
                return ApiResponse<CustomerAddressDto>.Fail($"Address with ID {id} not found");
            }

            var dto = _mapper.Map<CustomerAddressDto>(address);
            return ApiResponse<CustomerAddressDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting address by ID {Id}", id);
            return ApiResponse<CustomerAddressDto>.Fail("An error occurred while retrieving the address");
        }
    }

    public async Task<ApiResponse<IEnumerable<CustomerAddressDto>>> GetAddressesByCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(customerId, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<IEnumerable<CustomerAddressDto>>.Fail($"Customer with ID {customerId} not found");
            }

            var dtos = _mapper.Map<IEnumerable<CustomerAddressDto>>(customer.Addresses);
            return ApiResponse<IEnumerable<CustomerAddressDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting addresses for customer {CustomerId}", customerId);
            return ApiResponse<IEnumerable<CustomerAddressDto>>.Fail("An error occurred while retrieving addresses");
        }
    }

    public async Task<ApiResponse<CustomerAddressDto>> CreateAddressAsync(int customerId, CreateCustomerAddressDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(customerId, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<CustomerAddressDto>.Fail($"Customer with ID {customerId} not found");
            }

            var address = _mapper.Map<CustomerAddress>(dto);
            address.CustomerId = customerId;

            // If this is the first address or marked as primary, set it as default
            if (!customer.Addresses.Any() || dto.IsPrimary)
            {
                // Clear default from other addresses
                foreach (var existingAddress in customer.Addresses)
                {
                    existingAddress.IsDefault = false;
                }
                address.IsDefault = true;
            }

            customer.Addresses.Add(address);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created address {AddressId} for customer {CustomerId}", address.Id, customerId);

            var resultDto = _mapper.Map<CustomerAddressDto>(address);
            return ApiResponse<CustomerAddressDto>.Ok(resultDto, "Address created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating address for customer {CustomerId}", customerId);
            return ApiResponse<CustomerAddressDto>.Fail("An error occurred while creating the address");
        }
    }

    public async Task<ApiResponse<CustomerAddressDto>> UpdateAddressAsync(int id, UpdateCustomerAddressDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var customers = await _unitOfWork.Customers.FindWithIncludesAsync(
                c => c.Addresses.Any(a => a.Id == id),
                cancellationToken,
                c => c.Addresses);

            var customer = customers.FirstOrDefault();
            if (customer == null)
            {
                return ApiResponse<CustomerAddressDto>.Fail($"Address with ID {id} not found");
            }

            var address = customer.Addresses.First(a => a.Id == id);
            _mapper.Map(dto, address);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated address {AddressId}", id);

            var resultDto = _mapper.Map<CustomerAddressDto>(address);
            return ApiResponse<CustomerAddressDto>.Ok(resultDto, "Address updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating address {AddressId}", id);
            return ApiResponse<CustomerAddressDto>.Fail("An error occurred while updating the address");
        }
    }

    public async Task<ApiResponse<bool>> DeleteAddressAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var customers = await _unitOfWork.Customers.FindWithIncludesAsync(
                c => c.Addresses.Any(a => a.Id == id),
                cancellationToken,
                c => c.Addresses);

            var customer = customers.FirstOrDefault();
            if (customer == null)
            {
                return ApiResponse<bool>.Fail($"Address with ID {id} not found");
            }

            var address = customer.Addresses.First(a => a.Id == id);
            var wasDefault = address.IsDefault;

            customer.Addresses.Remove(address);

            // If we removed the default address, set another one as default
            if (wasDefault && customer.Addresses.Any())
            {
                customer.Addresses.First().IsDefault = true;
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted address {AddressId}", id);
            return ApiResponse<bool>.Ok(true, "Address deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting address {AddressId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the address");
        }
    }

    public async Task<ApiResponse<bool>> SetDefaultAddressAsync(int customerId, int addressId, CancellationToken cancellationToken = default)
    {
        try
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(customerId, cancellationToken);
            if (customer == null)
            {
                return ApiResponse<bool>.Fail($"Customer with ID {customerId} not found");
            }

            var address = customer.Addresses.FirstOrDefault(a => a.Id == addressId);
            if (address == null)
            {
                return ApiResponse<bool>.Fail($"Address with ID {addressId} not found for this customer");
            }

            // Clear default from all addresses
            foreach (var addr in customer.Addresses)
            {
                addr.IsDefault = addr.Id == addressId;
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Set address {AddressId} as default for customer {CustomerId}", addressId, customerId);
            return ApiResponse<bool>.Ok(true, "Default address updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default address {AddressId} for customer {CustomerId}", addressId, customerId);
            return ApiResponse<bool>.Fail("An error occurred while updating the default address");
        }
    }

    // Helper methods
    private async Task<string> GenerateCustomerCodeAsync(CustomerType customerType, CancellationToken cancellationToken)
    {
        var prefix = customerType switch
        {
            CustomerType.Pharmacy => "PHR",
            CustomerType.Hospital => "HSP",
            CustomerType.Clinic => "CLN",
            CustomerType.Retail => "RET",
            CustomerType.Wholesale => "WHL",
            _ => "CUS"
        };

        var count = await _unitOfWork.Customers.CountAsync(c => c.CustomerType == customerType, cancellationToken);
        return $"{prefix}{(count + 1):D6}";
    }
}
