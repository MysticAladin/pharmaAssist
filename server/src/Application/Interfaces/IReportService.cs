using Application.DTOs.Reports;

namespace Application.Interfaces;

public interface IReportService
{
    Task<ReportResultDto> GenerateReportAsync(ReportRequestDto request);
    Task<SalesReportDto> GetSalesReportDataAsync(DateTime startDate, DateTime endDate);
    Task<InventoryReportDto> GetInventoryReportDataAsync();
    Task<CustomerReportDto> GetCustomerReportDataAsync(int customerId, DateTime startDate, DateTime endDate);
    Task<byte[]> GenerateSalesPdfAsync(SalesReportDto data);
    Task<byte[]> GenerateInventoryPdfAsync(InventoryReportDto data);
    Task<byte[]> GenerateCustomerPdfAsync(CustomerReportDto data);
    Task<byte[]> ExportToExcelAsync<T>(IEnumerable<T> data, string sheetName);
    Task<byte[]> ExportToCsvAsync<T>(IEnumerable<T> data);
    
    // Customer/Drugstore Sales Reports
    Task<CustomerSalesReportDto> GetCustomerSalesReportAsync(CustomerSalesReportRequestDto request, CancellationToken cancellationToken = default);
    Task<ChainSalesReportDto> GetChainSalesReportAsync(int parentCustomerId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<List<CustomerSalesItemDto>> GetSalesByCustomerAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    
    // Report Builder
    Task<DataSourceFieldsDto> GetDataSourceFieldsAsync(ReportBuilderDataSource dataSource, CancellationToken cancellationToken = default);
    Task<ReportBuilderResultDto> ExecuteReportBuilderAsync(ReportBuilderExecuteRequestDto request, CancellationToken cancellationToken = default);
    Task<byte[]> ExportReportBuilderAsync(ReportBuilderExecuteRequestDto request, CancellationToken cancellationToken = default);
    
    // Saved Reports
    Task<List<SavedReportDto>> GetSavedReportsAsync(string? userId = null, CancellationToken cancellationToken = default);
    Task<SavedReportDto?> GetSavedReportByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<SavedReportDto> SaveReportAsync(ReportBuilderConfigDto config, string userId, CancellationToken cancellationToken = default);
    Task<bool> UpdateSavedReportAsync(int id, ReportBuilderConfigDto config, CancellationToken cancellationToken = default);
    Task<bool> DeleteSavedReportAsync(int id, CancellationToken cancellationToken = default);
}
