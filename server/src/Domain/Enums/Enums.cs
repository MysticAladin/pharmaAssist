namespace Domain.Enums;

/// <summary>
/// Type of customer
/// </summary>
public enum CustomerType
{
    Retail = 1,          // Individual customers
    Pharmacy = 2,        // Apoteka
    Hospital = 3,        // Hospital pharmacy
    Wholesale = 4,       // Veledrogerija
    Clinic = 5,          // Healthcare center
    Other = 99
}

/// <summary>
/// Customer classification tier based on purchase volume
/// </summary>
public enum CustomerTier
{
    A = 1,  // Premium - Monthly purchases > 10,000 KM
    B = 2,  // Standard - Monthly purchases 5,000-10,000 KM
    C = 3   // Basic - Monthly purchases < 5,000 KM
}

/// <summary>
/// Type of address
/// </summary>
public enum AddressType
{
    Billing = 1,
    Shipping = 2,
    Both = 3
}

/// <summary>
/// Order status workflow
/// </summary>
public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Processing = 3,
    ReadyForShipment = 4,
    Shipped = 5,
    Delivered = 6,
    Cancelled = 7,
    Returned = 8
}

/// <summary>
/// Payment status
/// </summary>
public enum PaymentStatus
{
    Pending = 1,
    PartiallyPaid = 2,
    Paid = 3,
    Refunded = 4,
    Failed = 5
}

/// <summary>
/// Payment method
/// </summary>
public enum PaymentMethod
{
    Cash = 1,
    CashOnDelivery = 2,
    BankTransfer = 3,
    CreditCard = 4,
    Invoice = 5  // Pay by invoice (credit terms)
}

/// <summary>
/// Stock movement type
/// </summary>
public enum StockMovementType
{
    In = 1,          // Stock received
    Out = 2,         // Stock sold/shipped
    Adjustment = 3,  // Manual adjustment
    Return = 4,      // Customer return
    Expired = 5,     // Expired stock removed
    Transfer = 6     // Transfer between locations
}

/// <summary>
/// Prescription status
/// </summary>
public enum PrescriptionStatus
{
    Pending = 1,
    Verified = 2,
    Rejected = 3,
    Expired = 4
}

/// <summary>
/// BiH administrative entity type
/// </summary>
public enum BiHEntityType
{
    FederacijaBiH = 1,   // FBiH - Federation of Bosnia and Herzegovina
    RepublikaSrpska = 2, // RS - Republika Srpska
    BrckoDstrikt = 3     // BD - Brčko District
}

/// <summary>
/// Product status
/// </summary>
public enum ProductStatus
{
    Active = 1,
    Inactive = 2,
    Discontinued = 3,
    OutOfStock = 4,
    ComingSoon = 5
}

/// <summary>
/// Notification email recipient type
/// </summary>
public enum NotificationEmailType
{
    /// <summary>
    /// Internal recipients notified when an order is placed.
    /// </summary>
    OrderPlacedInternal = 1
}

/// <summary>
/// Prescription requirement type
/// </summary>
public enum PrescriptionType
{
    None = 0,           // OTC - Over the counter
    Required = 1,       // Prescription required
    Controlled = 2      // Controlled substance
}

/// <summary>
/// Storage condition requirements
/// </summary>
public enum StorageCondition
{
    RoomTemperature = 1,  // 15-25°C
    Refrigerated = 2,     // 2-8°C
    Frozen = 3,           // Below -18°C
    ProtectFromLight = 4,
    ControlledRoom = 5    // 20-25°C
}

/// <summary>
/// Claim/Return type
/// </summary>
public enum ClaimType
{
    Return = 1,           // Full return of product
    Exchange = 2,         // Exchange for another product
    Refund = 3,           // Monetary refund
    Damaged = 4,          // Damaged product claim
    WrongProduct = 5,     // Wrong product received
    Expired = 6,          // Expired product received
    QualityIssue = 7      // Quality problem
}

/// <summary>
/// Claim status
/// </summary>
public enum ClaimStatus
{
    Submitted = 1,
    UnderReview = 2,
    Approved = 3,
    Rejected = 4,
    AwaitingReturn = 5,
    ReturnReceived = 6,
    Resolved = 7,
    Cancelled = 8
}

/// <summary>
/// Feature flag scope - determines where the flag applies
/// </summary>
public enum FlagScope
{
    System = 1,     // Global system-wide flag
    Client = 2      // Client/pharmacy-specific override
}

/// <summary>
/// Feature flag value type
/// </summary>
public enum FlagType
{
    Boolean = 1,     // True/False toggle
    String = 2,      // String value
    Number = 3,      // Numeric value
    Json = 4,        // Complex JSON object
    Percentage = 5   // Percentage rollout (0-100)
}

/// <summary>
/// Feature flag category for organization
/// </summary>
public enum FlagCategory
{
    Portal = 1,       // Customer portal features
    Billing = 2,      // Billing and invoicing features
    Inventory = 3,    // Inventory management features
    Orders = 4,       // Order processing features
    Reports = 5,      // Reporting features
    Integration = 6,  // Third-party integrations
    UI = 7,           // User interface features
    Experimental = 8  // Experimental/beta features
}

/// <summary>
/// Price type used for BiH-specific pricing rules (e.g., commercial vs essential medicines).
/// </summary>
public enum PriceType
{
    Commercial = 1,
    Essential = 2
}
