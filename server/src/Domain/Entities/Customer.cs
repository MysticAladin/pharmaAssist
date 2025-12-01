using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Customer entity for pharmacies, hospitals, and individual customers
/// </summary>
public class Customer : BaseEntity
{
    public string? UserId { get; set; } // FK to ApplicationUser (optional for B2B)
    public string CustomerCode { get; set; } = string.Empty;
    public CustomerType CustomerType { get; set; } = CustomerType.Retail;
    
    // Personal/Company info
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? TaxId { get; set; } // PDV/ID broj
    public string? RegistrationNumber { get; set; } // JIB
    
    // Contact
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? MobilePhone { get; set; }
    public string? Fax { get; set; }
    
    // Financial
    public decimal CreditLimit { get; set; } = 0;
    public int PaymentTermsDays { get; set; } = 30;
    public decimal CurrentBalance { get; set; } = 0;
    
    // Classification
    public CustomerTier Tier { get; set; } = CustomerTier.C;
    
    // Status
    public bool IsActive { get; set; } = true;
    public bool IsVerified { get; set; } = false;
    public DateTime? VerifiedAt { get; set; }
    public string? VerifiedBy { get; set; }

    public string FullName => string.IsNullOrEmpty(CompanyName) 
        ? $"{FirstName} {LastName}" 
        : CompanyName;

    // Navigation properties
    public virtual ApplicationUser? User { get; set; }
    public virtual ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
