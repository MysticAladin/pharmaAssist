using Application.DTOs.Common;
using Application.DTOs.PriceLists;
using Application.DTOs.Wholesaler;

namespace Application.Interfaces;

public interface IWholesalerDataService
{
    // Import management
    Task<ApiResponse<ImportPreviewDto>> PreviewFileAsync(Stream fileStream, string fileName, string? columnMapping, CancellationToken ct = default);
    Task<ApiResponse<ImportResultDto>> ImportFileAsync(Stream fileStream, string fileName, CreateImportRequest request, CancellationToken ct = default);
    Task<PagedResponse<WholesalerDataImportDto>> GetImportsAsync(int page, int pageSize, int? wholesalerId, string? status, string? sortBy, string? sortDirection, CancellationToken ct = default);
    Task<ApiResponse<WholesalerDataImportDetailDto>> GetImportByIdAsync(int id, CancellationToken ct = default);
    Task<ApiResponse<bool>> DeleteImportAsync(int id, CancellationToken ct = default);

    // Record matching
    Task<ApiResponse<List<WholesalerSalesRecordDto>>> GetUnmatchedRecordsAsync(int importId, string type, int page, int pageSize, CancellationToken ct = default);
    Task<ApiResponse<bool>> MatchRecordAsync(MatchRecordRequest request, CancellationToken ct = default);
    Task<ApiResponse<int>> BulkMatchRecordsAsync(BulkMatchRequest request, CancellationToken ct = default);

    // Stock
    Task<ApiResponse<List<WholesalerStockSummaryDto>>> GetStockSummaryAsync(int? wholesalerId, int? productId, CancellationToken ct = default);
}

public interface ISalesAnalyticsService
{
    Task<ApiResponse<SalesDashboardDto>> GetDashboardAsync(SalesAnalyticsFilter filter, CancellationToken ct = default);
    Task<ApiResponse<List<SalesByInstitutionDto>>> GetSalesByInstitutionAsync(SalesAnalyticsFilter filter, CancellationToken ct = default);
    Task<ApiResponse<List<SalesByInstitutionTypeDto>>> GetSalesByInstitutionTypeAsync(SalesAnalyticsFilter filter, CancellationToken ct = default);
    Task<ApiResponse<List<SalesByRegionDto>>> GetSalesByRegionAsync(SalesAnalyticsFilter filter, CancellationToken ct = default);
    Task<ApiResponse<List<SalesByProductDto>>> GetSalesByProductAsync(SalesAnalyticsFilter filter, CancellationToken ct = default);
    Task<ApiResponse<List<SalesByBrandDto>>> GetSalesByBrandAsync(SalesAnalyticsFilter filter, CancellationToken ct = default);
    Task<ApiResponse<List<SalesByRepDto>>> GetSalesByRepAsync(SalesAnalyticsFilter filter, CancellationToken ct = default);
    Task<ApiResponse<List<SalesTrendDto>>> GetSalesTrendAsync(SalesAnalyticsFilter filter, string granularity, CancellationToken ct = default);
}

public interface IPriceListService
{
    Task<PagedResponse<PriceListDto>> GetPriceListsAsync(PriceListFilterRequest filter, CancellationToken ct = default);
    Task<ApiResponse<PriceListDetailDto>> GetPriceListByIdAsync(int id, CancellationToken ct = default);
    Task<ApiResponse<PriceListDto>> CreatePriceListAsync(CreatePriceListRequest request, CancellationToken ct = default);
    Task<ApiResponse<PriceListDto>> UpdatePriceListAsync(int id, UpdatePriceListRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> DeletePriceListAsync(int id, CancellationToken ct = default);

    // Items
    Task<ApiResponse<PriceListItemDto>> AddItemAsync(CreatePriceListItemRequest request, CancellationToken ct = default);
    Task<ApiResponse<PriceListItemDto>> UpdateItemAsync(int id, UpdatePriceListItemRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> RemoveItemAsync(int id, CancellationToken ct = default);
    Task<ApiResponse<int>> BulkAddItemsAsync(BulkPriceListItemRequest request, CancellationToken ct = default);

    // Comparison
    Task<ApiResponse<List<PriceComparisonDto>>> ComparePriceListsAsync(List<int> priceListIds, int? productId, CancellationToken ct = default);
}
