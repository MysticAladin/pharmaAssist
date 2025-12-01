using Domain.Enums;

namespace Application.DTOs.Products;

/// <summary>
/// Product response DTO
/// </summary>
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? ATCCode { get; set; }
    
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int ManufacturerId { get; set; }
    public string? ManufacturerName { get; set; }
    
    public decimal UnitPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal TaxRate { get; set; }
    
    public bool RequiresPrescription { get; set; }
    public bool IsControlled { get; set; }
    public string? DosageForm { get; set; }
    public string? Strength { get; set; }
    public string? PackageSize { get; set; }
    
    public int StockQuantity { get; set; }
    public int ReorderLevel { get; set; }
    public int ReorderQuantity { get; set; }
    
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Create product request DTO
/// </summary>
public class CreateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string? ATCCode { get; set; }
    
    public int CategoryId { get; set; }
    public int ManufacturerId { get; set; }
    
    public decimal UnitPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal TaxRate { get; set; } = 17m;
    
    public bool RequiresPrescription { get; set; }
    public bool IsControlled { get; set; }
    public string? DosageForm { get; set; }
    public string? Strength { get; set; }
    public string? PackageSize { get; set; }
    
    public int ReorderLevel { get; set; } = 10;
    public int ReorderQuantity { get; set; } = 100;
    
    public string? ImageUrl { get; set; }
    public bool IsFeatured { get; set; }
}

/// <summary>
/// Update product request DTO
/// </summary>
public class UpdateProductDto
{
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? Description { get; set; }
    public string? DescriptionLocal { get; set; }
    public string? Barcode { get; set; }
    public string? ATCCode { get; set; }
    
    public int CategoryId { get; set; }
    public int ManufacturerId { get; set; }
    
    public decimal UnitPrice { get; set; }
    public decimal? CostPrice { get; set; }
    public decimal TaxRate { get; set; }
    
    public bool RequiresPrescription { get; set; }
    public bool IsControlled { get; set; }
    public string? DosageForm { get; set; }
    public string? Strength { get; set; }
    public string? PackageSize { get; set; }
    
    public int ReorderLevel { get; set; }
    public int ReorderQuantity { get; set; }
    
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
}

/// <summary>
/// Product list item (simplified for lists)
/// </summary>
public class ProductSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public string? ManufacturerName { get; set; }
    public decimal UnitPrice { get; set; }
    public int StockQuantity { get; set; }
    public bool RequiresPrescription { get; set; }
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
}

/// <summary>
/// Product batch/lot response DTO
/// </summary>
public class ProductBatchDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int InitialQuantity { get; set; }
    public int RemainingQuantity { get; set; }
    public decimal? CostPrice { get; set; }
    public bool IsActive { get; set; }
    public bool IsExpired => ExpiryDate < DateTime.UtcNow;
    public bool IsExpiringSoon => ExpiryDate < DateTime.UtcNow.AddDays(90) && !IsExpired;
}

/// <summary>
/// Create product batch request DTO
/// </summary>
public class CreateProductBatchDto
{
    public int ProductId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int InitialQuantity { get; set; }
    public decimal? CostPrice { get; set; }
}

/// <summary>
/// Update product batch request DTO
/// </summary>
public class UpdateProductBatchDto
{
    public DateTime? ManufactureDate { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int RemainingQuantity { get; set; }
    public decimal? CostPrice { get; set; }
    public bool IsActive { get; set; }
}
