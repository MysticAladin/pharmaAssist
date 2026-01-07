# Batch-Based Catalog Architecture Implementation

## Overview
Implemented batch-based product catalog to support pharmacy business requirements where **the same product with different expiration dates must be treated as separate sellable items**.

## Business Justification
In pharmacy operations, customers need to see and select specific batches of the same product based on expiration dates. A customer ordering "Amlodipine 5mg 30 tablets" should be able to choose between:
- Batch LOT2024-001: Expires June 2027 (730 days remaining)
- Batch LOT2024-045: Expires December 2026 (365 days remaining)

This allows pharmacies to order products with better expiration dates, reducing waste and ensuring patient safety.

## Frontend Changes Completed ✅

### 1. Data Models (`portal.model.ts`)

#### Updated `CartItem` Interface
```typescript
export interface CartItem {
  productId: string;
  batchId?: string;          // NEW: Specific batch being ordered
  batchNumber?: string;      // NEW: Batch number for display
  expiryDate?: string | null; // CHANGED: From earliestExpiryDate to expiryDate
  // ... other fields
}
```

#### New `ProductBatchCatalogItem` Interface
```typescript
export interface ProductBatchCatalogItem {
  id: string;                // Batch ID
  productId: string;
  productCode: string;
  productName: string;
  batchNumber: string;       // Batch/lot number
  expiryDate: string;        // ISO date string
  manufactureDate?: string;
  stockQuantity: number;     // Available quantity for this batch
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
  // ... all other product fields
}
```

### 2. Catalog Service (`catalog.service.ts`)

#### New Methods
```typescript
// Fetch product batches for catalog display
getProductBatches(
  filter: ProductFilter,
  pagination: PaginationParams
): Observable<PaginatedResult<ProductBatchCatalogItem>>

// Get batches for specific product
getProductBatchesById(productId: string): Observable<ProductBatchCatalogItem[]>
```

### 3. Catalog Component (`product-catalog.component.ts`)

#### Changes
- Changed `products` signal type to `ProductBatchCatalogItem[]`
- Updated template to display:
  - Batch number
  - Expiry date with days remaining
  - Warning styling for expiring batches
- Modified `loadProducts()` to call `getProductBatches()`
- Updated `addToCart()` to pass batch information

#### Template Enhancements
```html
<div class="product-meta">
  <span>{{ 'portal.product.batch' | translate }}: {{ product.batchNumber }}</span>
</div>
<div class="product-meta">
  <span [class.expiring-soon]="product.isExpiringSoon">
    {{ 'portal.product.expiry' | translate }}: {{ formatExpiry(product.expiryDate) }}
  </span>
  @if (product.daysUntilExpiry !== undefined) {
    <span [class.expiring-soon]="product.isExpiringSoon">
      ({{ product.daysUntilExpiry }} {{ 'portal.product.daysLeft' | translate }})
    </span>
  }
</div>
```

### 4. Cart Service (`cart.service.ts`)

#### Updated Methods
All cart operations now support batch-specific handling:

```typescript
addItem(
  product: ProductCatalogItem | CartItem,
  quantity: number = 1,
  batchId?: string,         // NEW: Batch ID
  batchNumber?: string,     // NEW: Batch number
  expiryDate?: string       // NEW: Batch expiry date
): void

removeItem(productId: string, batchId?: string): void
updateQuantity(productId: string, quantity: number, batchId?: string): void
incrementQuantity(productId: string, batchId?: string): void
decrementQuantity(productId: string, batchId?: string): void
```

#### Key Logic
- Cart items are uniquely identified by `productId + batchId` combination
- Same product with different batches = separate cart items
- Customers can order multiple batches of the same product

### 5. Translations

Added to both English and Bosnian:
- `portal.product.batch`: "Batch" / "Šarža"
- `portal.product.daysLeft`: "days left" / "dana preostalo"

### 6. Styling

Added CSS for batch information display:
```scss
.product-meta .batch-info {
  font-weight: 500;
  color: var(--text-color);
}

.product-meta .expiring-soon {
  color: var(--color-warning);
  font-weight: 500;
}
```

## Backend Requirements 🔧

### 1. New API Endpoint

**GET `/api/portal/product-batches`**

Query Parameters:
- `search`: string
- `category`: string (slug)
- `categoryId`: string (GUID)
- `manufacturerId`: string (GUID)
- `minPrice`: number
- `maxPrice`: number
- `inStockOnly`: boolean
- `requiresPrescription`: boolean
- `page`: number
- `pageSize`: number
- `sortBy`: string
- `sortOrder`: "asc" | "desc"

Response:
```json
{
  "items": [
    {
      "id": "batch-guid",
      "productId": "product-guid",
      "productCode": "RX-CVD-003",
      "productName": "Amlodipine 5mg",
      "genericName": "Amlodipine Besylate",
      "batchNumber": "LOT2024-001",
      "expiryDate": "2027-06-15T00:00:00Z",
      "manufactureDate": "2024-01-01T00:00:00Z",
      "stockQuantity": 150,
      "isAvailable": true,
      "isExpiringSoon": false,
      "daysUntilExpiry": 730,
      "unitPrice": 8.50,
      "priceType": "commercial",
      "customerPrice": 8.00,
      "manufacturer": "Bayer",
      "manufacturerId": "mfr-guid",
      "category": "Cardiovascular",
      "categoryId": "cat-guid",
      "packSize": "30 tablets",
      "requiresPrescription": true,
      "dosageForm": "Tablet",
      "strength": "5mg"
    }
  ],
  "totalCount": 245,
  "page": 1,
  "pageSize": 20,
  "totalPages": 13,
  "hasPrevious": false,
  "hasNext": true
}
```

### 2. Additional Endpoint

**GET `/api/portal/products/{productId}/batches`**

Returns all available batches for a specific product.

### 3. Database Considerations

#### ProductBatch Table
Ensure the ProductBatch table is properly linked:
- `ProductId`: FK to Products table
- `BatchNumber`: Unique batch/lot identifier
- `ExpiryDate`: Batch expiration date
- `ManufactureDate`: Production date
- `InitialQuantity`: Starting quantity
- `RemainingQuantity`: Current available stock
- `IsActive`: Batch is sellable
- `IsExpired`: Calculated field (ExpiryDate < Now)
- `IsExpiringSoon`: Calculated field (ExpiryDate < Now + 90 days)

#### Business Logic
- Calculate `daysUntilExpiry` = (ExpiryDate - Now).Days
- Filter out expired batches unless explicitly requested
- Sort batches by expiry date (longest first) by default
- Apply all product filters (category, manufacturer, price, etc.) to batch query

### 4. Order Processing Updates

When creating orders:
- `OrderItem` should include `ProductBatchId`
- Reduce `RemainingQuantity` from specific batch
- Prevent ordering more than `RemainingQuantity` for batch
- Track which batch was fulfilled in order history

## Product Form Changes (Next Phase)

### Current State
- Product form creates base product without expiration date ✅
- Removed confusing expiry date field from product form ✅
- Added info box explaining stock/expiry managed through Inventory ✅

### Future Enhancement
Users should be able to create batches when creating/receiving products:

**Product Form → Add Stock Section:**
```
[ ] Create initial stock batch
    Batch Number: ______
    Quantity: ______
    Manufacture Date: ______
    Expiry Date: ______
```

Or better yet, redirect to Inventory module after product creation to add first batch.

## Inventory Module Integration

### Stock Adjustment Form
Should create/update batches, not just adjust total stock:

**Current:** Adjust stock quantity for product  
**Proposed:** 
1. Select product
2. **Select existing batch OR create new batch**
3. If new batch:
   - Enter batch number
   - Enter expiry date
   - Enter manufacture date
4. Enter quantity to add/remove
5. Save creates/updates ProductBatch record

## Testing Checklist

### Frontend (Ready to Test)
- [ ] Catalog displays batches with batch numbers
- [ ] Expiry dates shown with days remaining
- [ ] Expiring batches highlighted in warning color
- [ ] Same product with different expiry dates appears as separate items
- [ ] Can add different batches of same product to cart
- [ ] Cart shows batch information and expiry dates
- [ ] Checkout preserves batch selection

### Backend (Implementation Needed)
- [ ] `/api/portal/product-batches` endpoint returns paginated batches
- [ ] Filtering works (category, manufacturer, price, stock)
- [ ] Sorting works (name, price, expiry date)
- [ ] Customer-specific pricing applied
- [ ] `/api/portal/products/{id}/batches` returns product batches
- [ ] Order creation includes `ProductBatchId`
- [ ] Stock reduction updates correct batch `RemainingQuantity`
- [ ] Cannot order more than batch `RemainingQuantity`

## Migration Path

### Phase 1: Backend API (Current Priority)
1. Create `/api/portal/product-batches` endpoint
2. Create `/api/portal/products/{id}/batches` endpoint
3. Update order processing to handle batches
4. Test with sample data

### Phase 2: Inventory Module Enhancement
1. Update stock adjustment form to create/manage batches
2. Add batch management UI
3. Migrate existing stock to batches (data migration script)

### Phase 3: Admin Product Form
1. Optional: Add "Create initial batch" section to product form
2. Or: Redirect to Inventory after product creation

## Benefits

✅ **Pharmacy Compliance**: Customers order products with known expiration dates  
✅ **Reduced Waste**: Better expiry date visibility reduces expired stock  
✅ **Batch Traceability**: Full tracking of which batch was sold to whom  
✅ **Flexible Inventory**: Same product can have multiple active batches  
✅ **Business Accuracy**: Matches real-world pharmacy operations

## Next Steps

1. **Backend Team**: Implement `/api/portal/product-batches` endpoint
2. **Test**: Verify batch catalog displays correctly with real data
3. **Inventory**: Update stock adjustment to create batches
4. **Product Form**: Optional enhancement to create initial batch

---

**Status**: Frontend complete ✅ | Backend implementation required 🔧  
**Build**: Successful (12.4 seconds)  
**Date**: January 6, 2026
