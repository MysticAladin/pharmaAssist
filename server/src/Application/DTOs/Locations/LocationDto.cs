namespace Application.DTOs.Locations;

/// <summary>
/// BiH Entity (FBiH, RS, BD) response DTO
/// </summary>
public class BiHEntityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int CantonCount { get; set; }
    public int MunicipalityCount { get; set; }
    public int CityCount { get; set; }
}

/// <summary>
/// Canton response DTO
/// </summary>
public class CantonDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int BiHEntityId { get; set; }
    public string BiHEntityName { get; set; } = string.Empty;
    public int MunicipalityCount { get; set; }
    public int CityCount { get; set; }
}

/// <summary>
/// Municipality response DTO
/// </summary>
public class MunicipalityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int CantonId { get; set; }
    public string CantonName { get; set; } = string.Empty;
    public int BiHEntityId { get; set; }
    public string BiHEntityName { get; set; } = string.Empty;
    public int CityCount { get; set; }
}

/// <summary>
/// City response DTO
/// </summary>
public class CityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameLocal { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public int MunicipalityId { get; set; }
    public string MunicipalityName { get; set; } = string.Empty;
    public int CantonId { get; set; }
    public string CantonName { get; set; } = string.Empty;
    public int BiHEntityId { get; set; }
    public string BiHEntityName { get; set; } = string.Empty;
}

/// <summary>
/// City summary for dropdowns
/// </summary>
public class CitySummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string MunicipalityName { get; set; } = string.Empty;
    public string CantonName { get; set; } = string.Empty;
    public string DisplayName => $"{Name} ({PostalCode})";
}

/// <summary>
/// Location hierarchy for cascading dropdowns
/// </summary>
public class LocationHierarchyDto
{
    public int BiHEntityId { get; set; }
    public string BiHEntityName { get; set; } = string.Empty;
    public List<CantonWithMunicipalitiesDto> Cantons { get; set; } = new();
}

/// <summary>
/// Canton with its municipalities
/// </summary>
public class CantonWithMunicipalitiesDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public List<MunicipalityWithCitiesDto> Municipalities { get; set; } = new();
}

/// <summary>
/// Municipality with its cities
/// </summary>
public class MunicipalityWithCitiesDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<CitySummaryDto> Cities { get; set; } = new();
}
