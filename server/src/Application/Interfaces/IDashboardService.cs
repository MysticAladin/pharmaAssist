using Application.DTOs.Dashboard;
using Application.DTOs.Common;

namespace Application.Interfaces;

/// <summary>
/// Dashboard and reporting service interface
/// </summary>
public interface IDashboardService
{
    Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<SalesSummaryDto>>> GetSalesSummaryAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<TopProductDto>>> GetTopProductsAsync(int count = 10, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<LowStockAlertDto>>> GetLowStockAlertsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<ExpiringProductDto>>> GetExpiringProductsAsync(int daysThreshold = 30, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<RecentOrderDto>>> GetRecentOrdersAsync(int count = 10, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<CategorySalesDto>>> GetSalesByCategoryAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<RegionalSalesDto>>> GetSalesByRegionAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
}
