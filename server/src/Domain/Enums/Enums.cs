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
