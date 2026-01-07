# Batch-Based Catalog - Backend Implementation

## Overview
This document describes the backend implementation for the batch-based catalog system, which allows customers to view and order pharmaceutical products by individual batches with specific expiration dates.

## Business Context
In pharmacy operations, the same product arriving at different times has different expiration dates and must be treated as separate sellable items (batches/series). Customers need to see and choose from multiple batches of the same product based on expiration dates.

## Implementation Details

### 1. Data Transfer Object (DTO)

**Location:** `server/src/Api/Controllers/PortalController.cs`

**Class:** `PortalProductBatchDto`

```csharp
public class PortalProductBatchDto
{
    // Batch-specific fields
    public int Id { get; set; }                        // Batch ID (primary key)
    public int ProductId { get; set; }                 // Reference to product
    public string BatchNumber { get; set; }            // Lot/Series number
    public DateTime ExpiryDate { get; set; }           // Batch expiry date
    public DateTime? ManufactureDate { get; set; }     // Batch manufacture date
    public int StockQuantity { get; set; }             // Available quantity for this batch
    public int DaysUntilExpiry { get; set; }           // Calculated: days remaining
    public bool IsExpiringSoon { get; set; }           // Calculated: expires within 90 days
    
    // Product information (denormalized for catalog display)
    public string ProductCode { get; set; }
    public string ProductName { get; set; }
    public string? GenericName { get; set; }
    public string Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal? CustomerPrice { get; set; }
    public string? PriceType { get; set; }
    public string? ImageUrl { get; set; }
    public string Category { get; set; }
    public string? CategoryId { get; set; }
    public string Manufacturer { get; set; }
    public string? ManufacturerId { get; set; }
    public bool RequiresPrescription { get; set; }
    public string? DosageForm { get; set; }
    public string? Strength { get; set; }
    public string? PackSize { get; set; }
}
```

### 2. API Endpoints

#### 2.1 GET /api/portal/product-batches

**Purpose:** Returns paginated list of product batches for catalog display

**Authorization:** [AllowAnonymous]

**Query Parameters:**
- `search` (string): Search in product name, SKU, batch number, description
- `categoryId` (int): Filter by specific category ID
- `category` (string): Filter by category name or slug (supports mappings like "medications", "equipment")
- `manufacturerId` (int): Filter by manufacturer ID
- `minPrice` (decimal): Minimum unit price
- `maxPrice` (decimal): Maximum unit price
- `inStockOnly` (bool): Only show batches with stock > 0
- `requiresPrescription` (bool): Filter by prescription requirement
- `sortBy` (string): Field to sort by (name, price, expiry, date)
- `sortOrder` (string): Sort direction (asc, desc)
- `page` (int): Page number (default: 1)
- `pageSize` (int): Items per page (default: 20)

**Query Logic:**
```csharp
1. Base query: ProductBatches with Product, Category, Manufacturer includes
2. Filter: IsActive batches, RemainingQuantity > 0, not expired, active products
3. Optional: Filter by central warehouse (products must exist in fulfillment warehouse)
4. Apply search filter across product name, SKU, batch number, description
5. Apply category filter (supports slug mappings)
6. Apply manufacturer, price, stock, prescription filters
7. Default sort: Product name, then expiry date
8. Calculate: DaysUntilExpiry, IsExpiringSoon
9. Return: Paginated response with metadata
```

**Response Format:**
```json
{
  "items": [
    {
      "id": 123,
      "productId": 45,
      "productCode": "MED-001",
      "productName": "Amlodipine 5mg",
      "batchNumber": "LOT-2025-001",
      "expiryDate": "2026-12-31T00:00:00Z",
      "manufactureDate": "2024-01-15T00:00:00Z",
      "stockQuantity": 500,
      "daysUntilExpiry": 365,
      "isExpiringSoon": false,
      "unitPrice": 12.50,
      "category": "Cardiovascular",
      "manufacturer": "Pfizer"
    }
  ],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8,
  "hasPrevious": false,
  "hasNext": true
}
```

#### 2.2 GET /api/portal/products/{productId}/batches

**Purpose:** Returns all available batches for a specific product

**Authorization:** [AllowAnonymous]

**Path Parameters:**
- `productId` (int): Product ID to get batches for

**Query Logic:**
```csharp
1. Query: ProductBatches for specific product ID
2. Filter: IsActive, RemainingQuantity > 0, not expired, product not deleted
3. Sort: ExpiryDate descending (longest expiry first)
4. Calculate: DaysUntilExpiry, IsExpiringSoon
5. Return: Array of batch DTOs
```

**Response Format:**
```json
[
  {
    "id": 123,
    "productId": 45,
    "batchNumber": "LOT-2025-002",
    "expiryDate": "2027-06-30T00:00:00Z",
    "daysUntilExpiry": 730,
    "isExpiringSoon": false,
    "stockQuantity": 300
  },
  {
    "id": 124,
    "productId": 45,
    "batchNumber": "LOT-2024-015",
    "expiryDate": "2025-12-31T00:00:00Z",
    "daysUntilExpiry": 180,
    "isExpiringSoon": false,
    "stockQuantity": 150
  }
]
```

### 3. Database Schema

**Entity:** `ProductBatch` (already exists in Domain/Entities)

**Table:** ProductBatches

**Key Fields:**
- `Id` (int): Primary key
- `ProductId` (int): Foreign key to Products
- `BatchNumber` (string): Unique batch/lot identifier
- `ExpiryDate` (DateTime): Batch expiration date
- `ManufactureDate` (DateTime?): Batch manufacture date
- `InitialQuantity` (int): Starting quantity
- `RemainingQuantity` (int): Current available quantity
- `CostPrice` (decimal?): Batch cost price
- `IsActive` (bool): Whether batch is active for sale

**Relationships:**
- Many-to-One with Product (via ProductId)

### 4. Business Rules

1. **Expiry Filtering:**
   - Only batches with `ExpiryDate >= DateTime.UtcNow` are returned
   - Expired batches are automatically excluded from catalog

2. **Stock Filtering:**
   - Only batches with `RemainingQuantity > 0` are shown
   - Depleted batches automatically disappear from catalog

3. **Expiry Warnings:**
   - `IsExpiringSoon = true` when expiry date is within 90 days
   - Frontend displays visual warnings for expiring batches

4. **Warehouse Integration:**
   - Batches only shown if parent product exists in central/fulfillment warehouse
   - Uses `GetCentralWarehouseIdAsync()` helper method

5. **Sorting Priority:**
   - Default: Product name alphabetically, then earliest expiry first
   - Expiry sort: Allows customers to find longest-lasting batches

### 5. Integration Points

#### Frontend Integration
- Endpoint: `/api/portal/product-batches`
- Service: `catalog.service.ts` → `getProductBatches()`
- Component: `product-catalog.component.ts`
- Display: Shows batch number, expiry date, days remaining

#### Cart System
- Cart items identified by: `productId + batchId`
- Allows multiple batches of same product in cart
- Order processing will need to store `ProductBatchId` (future enhancement)

#### Inventory System
- Stock reduction will target specific batch (future enhancement)
- FIFO (First In First Out) or FEFO (First Expired First Out) logic
- Integration with `InventoryStocks` table

### 6. Performance Considerations

1. **Eager Loading:**
   - Uses `.Include()` for Product, Category, Manufacturer
   - Prevents N+1 query problems

2. **Pagination:**
   - Default page size: 20 items
   - Prevents loading entire catalog at once

3. **Indexes Recommended:**
   - `ProductBatches.ProductId`
   - `ProductBatches.ExpiryDate`
   - `ProductBatches.IsActive`
   - `ProductBatches.RemainingQuantity`

4. **Query Optimization:**
   - Filters applied before pagination
   - Calculated fields (DaysUntilExpiry) computed in SELECT projection

### 7. Testing Checklist

- [ ] Verify batches return with all required fields
- [ ] Test pagination (page 1, 2, last page)
- [ ] Test search filter (product name, batch number, SKU)
- [ ] Test category filter (ID and slug-based)
- [ ] Test manufacturer filter
- [ ] Test price range filtering
- [ ] Test in-stock-only filter
- [ ] Test prescription filter
- [ ] Test sorting (name, price, expiry date)
- [ ] Verify expired batches are excluded
- [ ] Verify zero-stock batches are excluded
- [ ] Test GetProductBatchesById endpoint
- [ ] Verify DaysUntilExpiry calculation
- [ ] Verify IsExpiringSoon flag (90-day threshold)
- [ ] Test with warehouse integration

### 8. Migration Notes

**Existing Data:**
- ProductBatch table already exists with data
- No schema changes required
- Endpoints are additive (don't break existing /products endpoint)

**Gradual Rollout:**
1. Deploy backend endpoints (completed)
2. Frontend continues using /products endpoint
3. Switch frontend to /product-batches endpoint
4. Test thoroughly in production
5. Update order processing to store batch IDs
6. Retire old /products endpoint (optional)

### 9. Future Enhancements

1. **Customer-Specific Pricing:**
   - Add customer price calculation in batch DTO
   - Query CustomerPrices table for custom pricing

2. **Batch Reservations:**
   - Reserve specific batches during checkout
   - Prevent overselling of batches

3. **FEFO Support:**
   - Automatically select batches with earliest expiry
   - Optimize inventory turnover

4. **Batch Analytics:**
   - Track batch sales velocity
   - Identify slow-moving batches
   - Generate expiry reports

5. **Barcode Integration:**
   - Link batch numbers to barcodes
   - Support barcode scanning in warehouse

## Build Status

✅ **Build Successful** (12.2 seconds)
- No compilation errors
- All dependencies resolved
- Endpoints ready for testing

## Related Documentation

- Frontend Implementation: [BATCH-ARCHITECTURE-IMPLEMENTATION.md](BATCH-ARCHITECTURE-IMPLEMENTATION.md)
- API Documentation: Swagger UI at `/swagger`
- Database Schema: `ProductBatch` entity in `Domain/Entities`
