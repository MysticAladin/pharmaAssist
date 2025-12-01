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
}
