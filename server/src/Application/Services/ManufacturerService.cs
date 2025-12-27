using Application.DTOs.Common;
using Application.DTOs.Manufacturers;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace Application.Services;

/// <summary>
/// Manufacturer service implementation
/// </summary>
public class ManufacturerService : IManufacturerService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<ManufacturerService> _logger;

    public ManufacturerService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<ManufacturerService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<ApiResponse<ManufacturerDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var manufacturer = await _unitOfWork.Manufacturers.GetByIdAsync(id, cancellationToken);
            if (manufacturer == null)
            {
                return ApiResponse<ManufacturerDto>.Fail($"Manufacturer with ID {id} not found");
            }

            var dto = _mapper.Map<ManufacturerDto>(manufacturer);
            return ApiResponse<ManufacturerDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting manufacturer by ID {Id}", id);
            return ApiResponse<ManufacturerDto>.Fail("An error occurred while retrieving the manufacturer");
        }
    }

    public async Task<ApiResponse<IEnumerable<ManufacturerDto>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var manufacturers = await _unitOfWork.Manufacturers.GetAllWithIncludesAsync(
                cancellationToken,
                m => m.Products.Where(p => p.IsActive && !p.IsDeleted));
            var dtos = _mapper.Map<IEnumerable<ManufacturerDto>>(manufacturers);
            return ApiResponse<IEnumerable<ManufacturerDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all manufacturers");
            return ApiResponse<IEnumerable<ManufacturerDto>>.Fail("An error occurred while retrieving manufacturers");
        }
    }

    public async Task<PagedResponse<ManufacturerDto>> GetPagedAsync(
        int page,
        int pageSize,
        string? search = null,
        string? country = null,
        bool? activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _unitOfWork.Manufacturers.AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(m =>
                    m.Name.ToLower().Contains(searchLower) ||
                    (m.Country != null && m.Country.ToLower().Contains(searchLower)));
            }

            if (!string.IsNullOrEmpty(country))
            {
                query = query.Where(m => m.Country == country);
            }

            if (activeOnly == true)
            {
                query = query.Where(m => m.IsActive);
            }

            // Get total count
            var totalCount = query.Count();

            // Apply pagination
            var manufacturers = query
                .OrderBy(m => m.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var dtos = _mapper.Map<List<ManufacturerDto>>(manufacturers);

            return PagedResponse<ManufacturerDto>.Create(dtos, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting paged manufacturers");
            return PagedResponse<ManufacturerDto>.Create(new List<ManufacturerDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<IEnumerable<ManufacturerSummaryDto>>> GetSummaryListAsync(bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        try
        {
            IReadOnlyList<Manufacturer> manufacturers;
            if (activeOnly)
            {
                manufacturers = await _unitOfWork.Manufacturers.GetActiveManufacturersAsync(cancellationToken);
            }
            else
            {
                manufacturers = await _unitOfWork.Manufacturers.GetAllAsync(cancellationToken);
            }

            var dtos = _mapper.Map<IEnumerable<ManufacturerSummaryDto>>(manufacturers);
            return ApiResponse<IEnumerable<ManufacturerSummaryDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting manufacturer summary list");
            return ApiResponse<IEnumerable<ManufacturerSummaryDto>>.Fail("An error occurred while retrieving manufacturers");
        }
    }

    public async Task<ApiResponse<ManufacturerDto>> CreateAsync(CreateManufacturerDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check for duplicate name
            var existingManufacturers = await _unitOfWork.Manufacturers.FindAsync(
                m => m.Name == dto.Name,
                cancellationToken);

            if (existingManufacturers.Any())
            {
                return ApiResponse<ManufacturerDto>.Fail($"Manufacturer '{dto.Name}' already exists");
            }

            var manufacturer = _mapper.Map<Manufacturer>(dto);
            await _unitOfWork.Manufacturers.AddAsync(manufacturer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Created manufacturer {ManufacturerId} with name {Name}", manufacturer.Id, manufacturer.Name);

            var resultDto = _mapper.Map<ManufacturerDto>(manufacturer);
            return ApiResponse<ManufacturerDto>.Ok(resultDto, "Manufacturer created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating manufacturer with name {Name}", dto.Name);
            return ApiResponse<ManufacturerDto>.Fail("An error occurred while creating the manufacturer");
        }
    }

    public async Task<ApiResponse<ManufacturerDto>> UpdateAsync(int id, UpdateManufacturerDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var manufacturer = await _unitOfWork.Manufacturers.GetByIdAsync(id, cancellationToken);
            if (manufacturer == null)
            {
                return ApiResponse<ManufacturerDto>.Fail($"Manufacturer with ID {id} not found");
            }

            // Check for duplicate name if name is changing
            if (dto.Name != manufacturer.Name)
            {
                var existingManufacturers = await _unitOfWork.Manufacturers.FindAsync(
                    m => m.Name == dto.Name && m.Id != id,
                    cancellationToken);

                if (existingManufacturers.Any())
                {
                    return ApiResponse<ManufacturerDto>.Fail($"Manufacturer '{dto.Name}' already exists");
                }
            }

            _mapper.Map(dto, manufacturer);
            await _unitOfWork.Manufacturers.UpdateAsync(manufacturer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Updated manufacturer {ManufacturerId}", id);

            var resultDto = _mapper.Map<ManufacturerDto>(manufacturer);
            return ApiResponse<ManufacturerDto>.Ok(resultDto, "Manufacturer updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating manufacturer {ManufacturerId}", id);
            return ApiResponse<ManufacturerDto>.Fail("An error occurred while updating the manufacturer");
        }
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var manufacturer = await _unitOfWork.Manufacturers.GetByIdAsync(id, cancellationToken);
            if (manufacturer == null)
            {
                return ApiResponse<bool>.Fail($"Manufacturer with ID {id} not found");
            }

            // Check for products from this manufacturer
            var products = await _unitOfWork.Products.GetByManufacturerAsync(id, cancellationToken);
            if (products.Any())
            {
                // Soft delete instead
                manufacturer.IsActive = false;
                await _unitOfWork.Manufacturers.UpdateAsync(manufacturer, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Soft deleted manufacturer {ManufacturerId} (has products)", id);
                return ApiResponse<bool>.Ok(true, "Manufacturer deactivated (has associated products)");
            }

            await _unitOfWork.Manufacturers.DeleteAsync(manufacturer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deleted manufacturer {ManufacturerId}", id);
            return ApiResponse<bool>.Ok(true, "Manufacturer deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting manufacturer {ManufacturerId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the manufacturer");
        }
    }

    public async Task<ApiResponse<bool>> ActivateAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var manufacturer = await _unitOfWork.Manufacturers.GetByIdAsync(id, cancellationToken);
            if (manufacturer == null)
            {
                return ApiResponse<bool>.Fail($"Manufacturer with ID {id} not found");
            }

            manufacturer.IsActive = true;
            manufacturer.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Manufacturers.UpdateAsync(manufacturer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Activated manufacturer {ManufacturerId}", id);
            return ApiResponse<bool>.Ok(true, "Manufacturer activated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating manufacturer {ManufacturerId}", id);
            return ApiResponse<bool>.Fail("An error occurred while activating the manufacturer");
        }
    }

    public async Task<ApiResponse<bool>> DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        try
        {
            var manufacturer = await _unitOfWork.Manufacturers.GetByIdAsync(id, cancellationToken);
            if (manufacturer == null)
            {
                return ApiResponse<bool>.Fail($"Manufacturer with ID {id} not found");
            }

            manufacturer.IsActive = false;
            manufacturer.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Manufacturers.UpdateAsync(manufacturer, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Deactivated manufacturer {ManufacturerId}", id);
            return ApiResponse<bool>.Ok(true, "Manufacturer deactivated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating manufacturer {ManufacturerId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deactivating the manufacturer");
        }
    }
}
