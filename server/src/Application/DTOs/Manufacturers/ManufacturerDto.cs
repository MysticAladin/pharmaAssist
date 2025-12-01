namespace Application.DTOs.Manufacturers;

/// <summary>
/// Manufacturer response DTO
/// </summary>
public class ManufacturerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
}

/// <summary>
/// Create manufacturer request DTO
/// </summary>
public class CreateManufacturerDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
}

/// <summary>
/// Update manufacturer request DTO
/// </summary>
public class UpdateManufacturerDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Country { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// Manufacturer summary for dropdowns and lists
/// </summary>
public class ManufacturerSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
}
