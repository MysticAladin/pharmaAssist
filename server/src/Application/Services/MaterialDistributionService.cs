using Application.Common;
using Application.DTOs.Common;
using Application.DTOs.Materials;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace Application.Services;

public class MaterialDistributionService : IMaterialDistributionService
{
    private readonly IUnitOfWork _unitOfWork;

    public MaterialDistributionService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    // ───── Distributions ─────

    public async Task<PagedResult<MaterialDistributionDto>> GetDistributionsAsync(DistributionFilterDto filter)
    {
        var query = _unitOfWork.MaterialDistributions.AsQueryable()
            .Include(d => d.Rep).ThenInclude(r => r.User)
            .Include(d => d.Customer)
            .Include(d => d.Product)
            .AsQueryable();

        if (filter.RepId.HasValue)
            query = query.Where(d => d.RepId == filter.RepId.Value);

        if (filter.CustomerId.HasValue)
            query = query.Where(d => d.CustomerId == filter.CustomerId.Value);

        if (filter.MaterialType.HasValue)
            query = query.Where(d => d.MaterialType == filter.MaterialType.Value);

        if (filter.From.HasValue)
            query = query.Where(d => d.DistributedAt >= filter.From.Value);

        if (filter.To.HasValue)
            query = query.Where(d => d.DistributedAt <= filter.To.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(d => d.MaterialName.ToLower().Contains(search) ||
                                     (d.Notes != null && d.Notes.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync();

        query = (filter.SortBy?.ToLower()) switch
        {
            "materialname" => filter.SortDirection == "desc" ? query.OrderByDescending(d => d.MaterialName) : query.OrderBy(d => d.MaterialName),
            "quantity" => filter.SortDirection == "desc" ? query.OrderByDescending(d => d.Quantity) : query.OrderBy(d => d.Quantity),
            "distributedat" => filter.SortDirection == "desc" ? query.OrderByDescending(d => d.DistributedAt) : query.OrderBy(d => d.DistributedAt),
            _ => query.OrderByDescending(d => d.DistributedAt)
        };

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(d => new MaterialDistributionDto
            {
                Id = d.Id,
                RepId = d.RepId,
                RepName = d.Rep.User != null ? d.Rep.User.FullName : "Unknown",
                CustomerId = d.CustomerId,
                CustomerName = d.Customer.FullName,
                VisitId = d.VisitId,
                ProductId = d.ProductId,
                ProductName = d.Product != null ? d.Product.Name : null,
                MaterialName = d.MaterialName,
                MaterialType = d.MaterialType,
                Quantity = d.Quantity,
                LotNumber = d.LotNumber,
                DistributedAt = d.DistributedAt,
                Notes = d.Notes
            })
            .ToListAsync();

        return new PagedResult<MaterialDistributionDto>
        {
            Items = items,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<MaterialDistributionDto?> GetDistributionByIdAsync(int id)
    {
        var d = await _unitOfWork.MaterialDistributions.AsQueryable()
            .Include(d => d.Rep).ThenInclude(r => r.User)
            .Include(d => d.Customer)
            .Include(d => d.Product)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (d == null) return null;

        return new MaterialDistributionDto
        {
            Id = d.Id,
            RepId = d.RepId,
            RepName = d.Rep?.User?.FullName ?? "Unknown",
            CustomerId = d.CustomerId,
            CustomerName = d.Customer?.FullName ?? "Unknown",
            VisitId = d.VisitId,
            ProductId = d.ProductId,
            ProductName = d.Product?.Name,
            MaterialName = d.MaterialName,
            MaterialType = d.MaterialType,
            Quantity = d.Quantity,
            LotNumber = d.LotNumber,
            DistributedAt = d.DistributedAt,
            Notes = d.Notes
        };
    }

    public async Task<MaterialDistributionDto> CreateDistributionAsync(CreateDistributionRequest request)
    {
        var distribution = new MaterialDistribution
        {
            RepId = request.RepId,
            CustomerId = request.CustomerId,
            VisitId = request.VisitId,
            ProductId = request.ProductId,
            MaterialName = request.MaterialName,
            MaterialType = request.MaterialType,
            Quantity = request.Quantity,
            LotNumber = request.LotNumber,
            DistributedAt = DateTime.UtcNow,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.MaterialDistributions.AddAsync(distribution);

        // Deduct from rep inventory if exists
        var inventory = await _unitOfWork.RepInventories.AsQueryable()
            .FirstOrDefaultAsync(i => i.RepId == request.RepId && i.MaterialName == request.MaterialName && !i.IsDeleted);

        if (inventory != null)
        {
            inventory.Quantity = Math.Max(0, inventory.Quantity - request.Quantity);
            inventory.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.RepInventories.UpdateAsync(inventory);
        }

        await _unitOfWork.SaveChangesAsync();

        return (await GetDistributionByIdAsync(distribution.Id))!;
    }

    public async Task DeleteDistributionAsync(int id)
    {
        var distribution = await _unitOfWork.MaterialDistributions.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Distribution {id} not found");

        distribution.IsDeleted = true;
        distribution.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.MaterialDistributions.UpdateAsync(distribution);
        await _unitOfWork.SaveChangesAsync();
    }

    // ───── Rep Inventory ─────

    public async Task<List<RepInventoryDto>> GetRepInventoryAsync(int repId)
    {
        return await _unitOfWork.RepInventories.AsQueryable()
            .Include(i => i.Rep).ThenInclude(r => r.User)
            .Include(i => i.Product)
            .Where(i => i.RepId == repId)
            .OrderBy(i => i.MaterialName)
            .Select(i => new RepInventoryDto
            {
                Id = i.Id,
                RepId = i.RepId,
                RepName = i.Rep.User != null ? i.Rep.User.FullName : "Unknown",
                ProductId = i.ProductId,
                ProductName = i.Product != null ? i.Product.Name : null,
                MaterialName = i.MaterialName,
                Quantity = i.Quantity,
                MinQuantity = i.MinQuantity,
                LastRestockedAt = i.LastRestockedAt
            })
            .ToListAsync();
    }

    public async Task<RepInventoryDto> UpdateRepInventoryAsync(UpdateRepInventoryRequest request)
    {
        var existing = await _unitOfWork.RepInventories.AsQueryable()
            .FirstOrDefaultAsync(i => i.RepId == request.RepId && i.MaterialName == request.MaterialName && !i.IsDeleted);

        if (existing != null)
        {
            existing.Quantity = request.Quantity;
            existing.MinQuantity = request.MinQuantity;
            existing.ProductId = request.ProductId;
            existing.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.RepInventories.UpdateAsync(existing);
        }
        else
        {
            existing = new RepInventory
            {
                RepId = request.RepId,
                ProductId = request.ProductId,
                MaterialName = request.MaterialName,
                Quantity = request.Quantity,
                MinQuantity = request.MinQuantity,
                LastRestockedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.RepInventories.AddAsync(existing);
        }

        await _unitOfWork.SaveChangesAsync();

        var dto = await _unitOfWork.RepInventories.AsQueryable()
            .Include(i => i.Rep).ThenInclude(r => r.User)
            .Include(i => i.Product)
            .Where(i => i.Id == existing.Id)
            .Select(i => new RepInventoryDto
            {
                Id = i.Id,
                RepId = i.RepId,
                RepName = i.Rep.User != null ? i.Rep.User.FullName : "Unknown",
                ProductId = i.ProductId,
                ProductName = i.Product != null ? i.Product.Name : null,
                MaterialName = i.MaterialName,
                Quantity = i.Quantity,
                MinQuantity = i.MinQuantity,
                LastRestockedAt = i.LastRestockedAt
            })
            .FirstAsync();

        return dto;
    }

    public async Task RestockInventoryAsync(int inventoryId, RestockInventoryRequest request)
    {
        var inventory = await _unitOfWork.RepInventories.GetByIdAsync(inventoryId)
            ?? throw new KeyNotFoundException($"RepInventory {inventoryId} not found");

        inventory.Quantity += request.Quantity;
        inventory.LastRestockedAt = DateTime.UtcNow;
        inventory.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.RepInventories.UpdateAsync(inventory);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteRepInventoryAsync(int inventoryId)
    {
        var inventory = await _unitOfWork.RepInventories.GetByIdAsync(inventoryId)
            ?? throw new KeyNotFoundException($"RepInventory {inventoryId} not found");

        inventory.IsDeleted = true;
        inventory.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.RepInventories.UpdateAsync(inventory);
        await _unitOfWork.SaveChangesAsync();
    }

    // ───── Reports ─────

    public async Task<DistributionSummaryDto> GetDistributionSummaryAsync(DateTime? from, DateTime? to, int? repId)
    {
        var query = _unitOfWork.MaterialDistributions.AsQueryable()
            .Include(d => d.Rep).ThenInclude(r => r.User)
            .AsQueryable();

        if (from.HasValue) query = query.Where(d => d.DistributedAt >= from.Value);
        if (to.HasValue) query = query.Where(d => d.DistributedAt <= to.Value);
        if (repId.HasValue) query = query.Where(d => d.RepId == repId.Value);

        var data = await query.ToListAsync();

        return new DistributionSummaryDto
        {
            TotalDistributions = data.Count,
            TotalQuantity = data.Sum(d => d.Quantity),
            UniqueCustomers = data.Select(d => d.CustomerId).Distinct().Count(),
            UniqueReps = data.Select(d => d.RepId).Distinct().Count(),
            ByMaterialType = data.GroupBy(d => d.MaterialType).Select(g => new MaterialTypeSummaryDto
            {
                MaterialType = g.Key,
                Count = g.Count(),
                TotalQuantity = g.Sum(d => d.Quantity)
            }).OrderByDescending(x => x.TotalQuantity).ToList(),
            ByRep = data.GroupBy(d => new { d.RepId, RepName = d.Rep?.User?.FullName ?? "Unknown" }).Select(g => new RepDistributionSummaryDto
            {
                RepId = g.Key.RepId,
                RepName = g.Key.RepName,
                DistributionCount = g.Count(),
                TotalQuantity = g.Sum(d => d.Quantity),
                UniqueCustomers = g.Select(d => d.CustomerId).Distinct().Count()
            }).OrderByDescending(x => x.TotalQuantity).Take(20).ToList(),
            ByProduct = data.GroupBy(d => new { d.ProductId, d.MaterialName }).Select(g => new ProductDistributionSummaryDto
            {
                ProductId = g.Key.ProductId,
                MaterialName = g.Key.MaterialName,
                DistributionCount = g.Count(),
                TotalQuantity = g.Sum(d => d.Quantity)
            }).OrderByDescending(x => x.TotalQuantity).Take(20).ToList()
        };
    }

    public async Task<byte[]> ExportDistributionsAsync(DistributionFilterDto filter)
    {
        ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;

        // Get all matching distributions (no paging for export)
        var query = _unitOfWork.MaterialDistributions.AsQueryable()
            .Include(d => d.Rep).ThenInclude(r => r.User)
            .Include(d => d.Customer)
            .Include(d => d.Product)
            .AsQueryable();

        if (filter.RepId.HasValue) query = query.Where(d => d.RepId == filter.RepId.Value);
        if (filter.CustomerId.HasValue) query = query.Where(d => d.CustomerId == filter.CustomerId.Value);
        if (filter.MaterialType.HasValue) query = query.Where(d => d.MaterialType == filter.MaterialType.Value);
        if (filter.From.HasValue) query = query.Where(d => d.DistributedAt >= filter.From.Value);
        if (filter.To.HasValue) query = query.Where(d => d.DistributedAt <= filter.To.Value);

        var data = await query.OrderByDescending(d => d.DistributedAt).ToListAsync();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Material Distributions");

        ws.Cells[1, 1].Value = "Rep";
        ws.Cells[1, 2].Value = "Customer";
        ws.Cells[1, 3].Value = "Material";
        ws.Cells[1, 4].Value = "Type";
        ws.Cells[1, 5].Value = "Quantity";
        ws.Cells[1, 6].Value = "Lot Number";
        ws.Cells[1, 7].Value = "Distributed At";
        ws.Cells[1, 8].Value = "Product";
        ws.Cells[1, 9].Value = "Notes";

        var row = 2;
        foreach (var d in data)
        {
            ws.Cells[row, 1].Value = d.Rep?.User?.FullName ?? "Unknown";
            ws.Cells[row, 2].Value = d.Customer?.FullName ?? "Unknown";
            ws.Cells[row, 3].Value = d.MaterialName;
            ws.Cells[row, 4].Value = d.MaterialType.ToString();
            ws.Cells[row, 5].Value = d.Quantity;
            ws.Cells[row, 6].Value = d.LotNumber;
            ws.Cells[row, 7].Value = d.DistributedAt.ToString("yyyy-MM-dd HH:mm");
            ws.Cells[row, 8].Value = d.Product?.Name ?? "";
            ws.Cells[row, 9].Value = d.Notes ?? "";
            row++;
        }

        ws.Cells[ws.Dimension.Address].AutoFitColumns();
        return package.GetAsByteArray();
    }
}
