using Application.DTOs.Common;
using Application.DTOs.Wholesaler;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OfficeOpenXml;
using System.Globalization;
using System.Text.Json;

namespace Application.Services;

public class WholesalerDataService : IWholesalerDataService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<WholesalerDataService> _logger;

    public WholesalerDataService(IUnitOfWork unitOfWork, ILogger<WholesalerDataService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    #region Import Management

    public async Task<ApiResponse<ImportPreviewDto>> PreviewFileAsync(
        Stream fileStream, string fileName, string? columnMapping, CancellationToken ct = default)
    {
        try
        {
            var rows = await ParseFileAsync(fileStream, fileName, ct);
            if (rows.Count == 0)
                return ApiResponse<ImportPreviewDto>.Fail("File is empty or could not be parsed");

            var headers = rows[0].Keys.ToList();
            var preview = new ImportPreviewDto
            {
                TotalRows = rows.Count,
                DetectedColumns = headers,
                PreviewRows = rows.Take(10).ToList(),
                Warnings = new List<string>()
            };

            // Detect potential mapping issues
            var expectedColumns = new[] { "ProductCode", "ProductName", "CustomerCode", "CustomerName", "Quantity", "UnitPrice", "TotalAmount", "InvoiceDate", "InvoiceNumber" };
            var missing = expectedColumns.Where(e => !headers.Any(h => h.Equals(e, StringComparison.OrdinalIgnoreCase))).ToList();
            if (missing.Count > 0)
                preview.Warnings.Add($"Missing expected columns: {string.Join(", ", missing)}. Please configure column mapping.");

            return ApiResponse<ImportPreviewDto>.Ok(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing file {FileName}", fileName);
            return ApiResponse<ImportPreviewDto>.Fail("Failed to preview file: " + ex.Message);
        }
    }

    public async Task<ApiResponse<ImportResultDto>> ImportFileAsync(
        Stream fileStream, string fileName, CreateImportRequest request, CancellationToken ct = default)
    {
        try
        {
            // Validate wholesaler exists
            var wholesaler = await _unitOfWork.Customers.GetByIdAsync(request.WholesalerId, ct);
            if (wholesaler == null)
                return ApiResponse<ImportResultDto>.Fail("Wholesaler not found");

            // Parse file
            var rows = await ParseFileAsync(fileStream, fileName, ct);
            if (rows.Count == 0)
                return ApiResponse<ImportResultDto>.Fail("File is empty or could not be parsed");

            // Parse column mapping
            Dictionary<string, string>? mapping = null;
            if (!string.IsNullOrEmpty(request.ColumnMapping))
                mapping = JsonSerializer.Deserialize<Dictionary<string, string>>(request.ColumnMapping);

            // Create import record
            var import = new WholesalerDataImport
            {
                WholesalerId = request.WholesalerId,
                WholesalerName = wholesaler.FullName,
                FileName = fileName,
                ImportDate = DateTime.UtcNow,
                Period = request.Period,
                Status = ImportStatus.Processing,
                ColumnMapping = request.ColumnMapping,
                Notes = request.Notes
            };
            await _unitOfWork.WholesalerDataImports.AddAsync(import, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            // Process rows
            var result = await ProcessImportRows(import, rows, mapping, ct);

            // Update import with results
            import.RecordCount = result.TotalRecords;
            import.ErrorCount = result.ErrorCount;
            import.MatchedProductCount = result.MatchedProducts;
            import.MatchedCustomerCount = result.MatchedCustomers;
            import.UnmatchedProductCount = result.UnmatchedProducts;
            import.UnmatchedCustomerCount = result.UnmatchedCustomers;
            import.Status = result.ErrorCount > 0 ? ImportStatus.CompletedWithErrors : ImportStatus.Completed;

            if (result.Errors.Count > 0)
                import.ErrorLog = JsonSerializer.Serialize(result.Errors.Take(100));

            await _unitOfWork.WholesalerDataImports.UpdateAsync(import, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            result.ImportId = import.Id;
            return ApiResponse<ImportResultDto>.Ok(result, "Import completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing file {FileName}", fileName);
            return ApiResponse<ImportResultDto>.Fail("Import failed: " + ex.Message);
        }
    }

    public async Task<PagedResponse<WholesalerDataImportDto>> GetImportsAsync(
        int page, int pageSize, int? wholesalerId, string? status,
        string? sortBy, string? sortDirection, CancellationToken ct = default)
    {
        try
        {
            IQueryable<WholesalerDataImport> query = _unitOfWork.WholesalerDataImports.AsQueryable()
                .Include(i => i.Wholesaler);

            if (wholesalerId.HasValue)
                query = query.Where(i => i.WholesalerId == wholesalerId.Value);

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ImportStatus>(status, true, out var statusEnum))
                query = query.Where(i => i.Status == statusEnum);

            var totalCount = await query.CountAsync(ct);

            var isDesc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            query = sortBy?.ToLower() switch
            {
                "date" or "importdate" => isDesc ? query.OrderByDescending(i => i.ImportDate) : query.OrderBy(i => i.ImportDate),
                "wholesaler" => isDesc ? query.OrderByDescending(i => i.WholesalerName) : query.OrderBy(i => i.WholesalerName),
                "status" => isDesc ? query.OrderByDescending(i => i.Status) : query.OrderBy(i => i.Status),
                "records" => isDesc ? query.OrderByDescending(i => i.RecordCount) : query.OrderBy(i => i.RecordCount),
                _ => query.OrderByDescending(i => i.ImportDate)
            };

            var imports = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            var dtos = imports.Select(MapImportToDto).ToList();
            return PagedResponse<WholesalerDataImportDto>.Create(dtos, totalCount, page, pageSize);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting imports");
            return PagedResponse<WholesalerDataImportDto>.Create(new List<WholesalerDataImportDto>(), 0, page, pageSize);
        }
    }

    public async Task<ApiResponse<WholesalerDataImportDetailDto>> GetImportByIdAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var import = await _unitOfWork.WholesalerDataImports.AsQueryable()
                .Include(i => i.Wholesaler)
                .Include(i => i.SalesRecords.Take(100))
                    .ThenInclude(s => s.Product)
                .Include(i => i.SalesRecords.Take(100))
                    .ThenInclude(s => s.Customer)
                .Include(i => i.StockRecords.Take(100))
                    .ThenInclude(s => s.Product)
                .FirstOrDefaultAsync(i => i.Id == id, ct);

            if (import == null)
                return ApiResponse<WholesalerDataImportDetailDto>.Fail("Import not found");

            var dto = new WholesalerDataImportDetailDto
            {
                Id = import.Id,
                WholesalerId = import.WholesalerId,
                WholesalerName = import.WholesalerName,
                FileName = import.FileName,
                ImportDate = import.ImportDate,
                Period = import.Period,
                Status = import.Status,
                RecordCount = import.RecordCount,
                ErrorCount = import.ErrorCount,
                MatchedProductCount = import.MatchedProductCount,
                MatchedCustomerCount = import.MatchedCustomerCount,
                UnmatchedProductCount = import.UnmatchedProductCount,
                UnmatchedCustomerCount = import.UnmatchedCustomerCount,
                Notes = import.Notes,
                CreatedAt = import.CreatedAt,
                ColumnMapping = import.ColumnMapping,
                ErrorLog = import.ErrorLog,
                SalesRecords = import.SalesRecords.Select(MapSalesRecordToDto).ToList(),
                StockRecords = import.StockRecords.Select(MapStockRecordToDto).ToList()
            };

            return ApiResponse<WholesalerDataImportDetailDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting import {ImportId}", id);
            return ApiResponse<WholesalerDataImportDetailDto>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> DeleteImportAsync(int id, CancellationToken ct = default)
    {
        try
        {
            var import = await _unitOfWork.WholesalerDataImports.AsQueryable()
                .Include(i => i.SalesRecords)
                .Include(i => i.StockRecords)
                .FirstOrDefaultAsync(i => i.Id == id, ct);

            if (import == null)
                return ApiResponse<bool>.Fail("Import not found");

            // Delete child records first
            if (import.SalesRecords.Any())
                await _unitOfWork.WholesalerSalesRecords.DeleteRangeAsync(import.SalesRecords, ct);
            if (import.StockRecords.Any())
                await _unitOfWork.WholesalerStockRecords.DeleteRangeAsync(import.StockRecords, ct);

            await _unitOfWork.WholesalerDataImports.DeleteAsync(import, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            return ApiResponse<bool>.Ok(true, "Import deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting import {ImportId}", id);
            return ApiResponse<bool>.Fail("An error occurred while deleting the import");
        }
    }

    #endregion

    #region Record Matching

    public async Task<ApiResponse<List<WholesalerSalesRecordDto>>> GetUnmatchedRecordsAsync(
        int importId, string type, int page, int pageSize, CancellationToken ct = default)
    {
        try
        {
            var query = _unitOfWork.WholesalerSalesRecords.AsQueryable()
                .Include(r => r.Product)
                .Include(r => r.Customer)
                .Where(r => r.ImportId == importId);

            if (type.Equals("product", StringComparison.OrdinalIgnoreCase))
                query = query.Where(r => r.ProductId == null);
            else if (type.Equals("customer", StringComparison.OrdinalIgnoreCase))
                query = query.Where(r => r.CustomerId == null);

            var records = await query
                .OrderBy(r => r.ProductName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            var dtos = records.Select(MapSalesRecordToDto).ToList();
            return ApiResponse<List<WholesalerSalesRecordDto>>.Ok(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unmatched records for import {ImportId}", importId);
            return ApiResponse<List<WholesalerSalesRecordDto>>.Fail("An error occurred");
        }
    }

    public async Task<ApiResponse<bool>> MatchRecordAsync(MatchRecordRequest request, CancellationToken ct = default)
    {
        try
        {
            var record = await _unitOfWork.WholesalerSalesRecords.GetByIdAsync(request.RecordId, ct);
            if (record == null)
                return ApiResponse<bool>.Fail("Record not found");

            if (request.ProductId.HasValue)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId.Value, ct);
                if (product == null) return ApiResponse<bool>.Fail("Product not found");
                record.ProductId = request.ProductId;
            }

            if (request.CustomerId.HasValue)
            {
                var customer = await _unitOfWork.Customers.GetByIdAsync(request.CustomerId.Value, ct);
                if (customer == null) return ApiResponse<bool>.Fail("Customer not found");
                record.CustomerId = request.CustomerId;
            }

            record.IsManuallyMatched = true;
            await _unitOfWork.WholesalerSalesRecords.UpdateAsync(record, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            // Update import match counts
            await UpdateImportMatchCounts(record.ImportId, ct);

            return ApiResponse<bool>.Ok(true, "Record matched successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error matching record {RecordId}", request.RecordId);
            return ApiResponse<bool>.Fail("An error occurred while matching the record");
        }
    }

    public async Task<ApiResponse<int>> BulkMatchRecordsAsync(BulkMatchRequest request, CancellationToken ct = default)
    {
        try
        {
            var matchedCount = 0;
            var importIds = new HashSet<int>();

            foreach (var match in request.Matches)
            {
                var record = await _unitOfWork.WholesalerSalesRecords.GetByIdAsync(match.RecordId, ct);
                if (record == null) continue;

                if (match.ProductId.HasValue) record.ProductId = match.ProductId;
                if (match.CustomerId.HasValue) record.CustomerId = match.CustomerId;
                record.IsManuallyMatched = true;

                await _unitOfWork.WholesalerSalesRecords.UpdateAsync(record, ct);
                importIds.Add(record.ImportId);
                matchedCount++;
            }

            await _unitOfWork.SaveChangesAsync(ct);

            // Update match counts for affected imports
            foreach (var importId in importIds)
                await UpdateImportMatchCounts(importId, ct);

            return ApiResponse<int>.Ok(matchedCount, $"{matchedCount} records matched successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk matching records");
            return ApiResponse<int>.Fail("An error occurred during bulk matching");
        }
    }

    #endregion

    #region Stock

    public async Task<ApiResponse<List<WholesalerStockSummaryDto>>> GetStockSummaryAsync(
        int? wholesalerId, int? productId, CancellationToken ct = default)
    {
        try
        {
            var query = _unitOfWork.WholesalerStockRecords.AsQueryable()
                .Include(s => s.Wholesaler)
                .Include(s => s.Product)
                .AsQueryable();

            if (wholesalerId.HasValue)
                query = query.Where(s => s.WholesalerId == wholesalerId.Value);

            if (productId.HasValue)
                query = query.Where(s => s.ProductId == productId.Value);

            // Get latest stock records per product per wholesaler
            var latestRecords = await query
                .GroupBy(s => new { s.ProductId, s.WholesalerId })
                .Select(g => g.OrderByDescending(s => s.ReportDate).First())
                .ToListAsync(ct);

            var summaries = latestRecords
                .GroupBy(r => r.ProductId)
                .Select(g => new WholesalerStockSummaryDto
                {
                    ProductId = g.Key ?? 0,
                    ProductName = g.First().Product?.Name ?? g.First().ProductName,
                    TotalStock = g.Sum(r => r.Quantity),
                    StockLevels = g.Select(r => new WholesalerStockLevelDto
                    {
                        WholesalerId = r.WholesalerId,
                        WholesalerName = r.Wholesaler?.FullName ?? string.Empty,
                        Quantity = r.Quantity,
                        ReportDate = r.ReportDate
                    }).ToList()
                })
                .OrderBy(s => s.ProductName)
                .ToList();

            return ApiResponse<List<WholesalerStockSummaryDto>>.Ok(summaries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stock summary");
            return ApiResponse<List<WholesalerStockSummaryDto>>.Fail("An error occurred");
        }
    }

    #endregion

    #region Private Helpers

    private async Task<List<Dictionary<string, string>>> ParseFileAsync(Stream fileStream, string fileName, CancellationToken ct)
    {
        var rows = new List<Dictionary<string, string>>();

        if (fileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase) ||
            fileName.EndsWith(".txt", StringComparison.OrdinalIgnoreCase))
        {
            rows = await ParseCsvAsync(fileStream, ct);
        }
        else if (fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase) ||
                 fileName.EndsWith(".xls", StringComparison.OrdinalIgnoreCase))
        {
            rows = ParseExcel(fileStream);
        }

        return rows;
    }

    private static async Task<List<Dictionary<string, string>>> ParseCsvAsync(Stream stream, CancellationToken ct)
    {
        var rows = new List<Dictionary<string, string>>();
        using var reader = new StreamReader(stream);

        var headerLine = await reader.ReadLineAsync(ct);
        if (headerLine == null) return rows;

        // Detect delimiter
        var delimiter = headerLine.Contains(';') ? ';' : ',';
        var headers = headerLine.Split(delimiter).Select(h => h.Trim().Trim('"')).ToArray();

        while (await reader.ReadLineAsync(ct) is { } line)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            var values = line.Split(delimiter).Select(v => v.Trim().Trim('"')).ToArray();
            var row = new Dictionary<string, string>();
            for (int i = 0; i < headers.Length && i < values.Length; i++)
            {
                row[headers[i]] = values[i];
            }
            rows.Add(row);
        }

        return rows;
    }

    private static List<Dictionary<string, string>> ParseExcel(Stream stream)
    {
        ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;
        var rows = new List<Dictionary<string, string>>();

        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();
        if (worksheet == null) return rows;

        var rowCount = worksheet.Dimension?.Rows ?? 0;
        var colCount = worksheet.Dimension?.Columns ?? 0;
        if (rowCount == 0) return rows;

        // Read headers from first row
        var headers = new string[colCount];
        for (int col = 1; col <= colCount; col++)
        {
            headers[col - 1] = worksheet.Cells[1, col].Text?.Trim() ?? $"Column{col}";
        }

        // Read data rows
        for (int row = 2; row <= rowCount; row++)
        {
            var rowData = new Dictionary<string, string>();
            var hasData = false;
            for (int col = 1; col <= colCount; col++)
            {
                var value = worksheet.Cells[row, col].Text?.Trim() ?? string.Empty;
                rowData[headers[col - 1]] = value;
                if (!string.IsNullOrEmpty(value)) hasData = true;
            }
            if (hasData) rows.Add(rowData);
        }

        return rows;
    }

    private async Task<ImportResultDto> ProcessImportRows(
        WholesalerDataImport import, List<Dictionary<string, string>> rows,
        Dictionary<string, string>? mapping, CancellationToken ct)
    {
        var result = new ImportResultDto { TotalRecords = rows.Count };

        // Load products and customers for auto-matching
        var products = await _unitOfWork.Products.GetAllAsync(ct);
        var customers = await _unitOfWork.Customers.GetAllAsync(ct);

        var productLookup = products.ToDictionary(p => p.SKU?.ToLower() ?? string.Empty, p => p);
        var productNameLookup = products.ToDictionary(p => p.Name.ToLower(), p => p);
        var customerCodeLookup = customers.ToDictionary(c => c.CustomerCode?.ToLower() ?? string.Empty, c => c);
        var customerNameLookup = customers.ToDictionary(c => c.FullName.ToLower(), c => c);

        var matchedProductIds = new HashSet<int>();
        var matchedCustomerIds = new HashSet<int>();
        var unmatchedProductCodes = new HashSet<string>();
        var unmatchedCustomerCodes = new HashSet<string>();

        var salesRecords = new List<WholesalerSalesRecord>();

        for (int i = 0; i < rows.Count; i++)
        {
            try
            {
                var row = rows[i];
                var record = MapRowToSalesRecord(row, mapping, import.Id);

                // Auto-match product
                if (!string.IsNullOrEmpty(record.ProductCode))
                {
                    var code = record.ProductCode.ToLower();
                    if (productLookup.TryGetValue(code, out var product))
                    {
                        record.ProductId = product.Id;
                        matchedProductIds.Add(product.Id);
                    }
                    else if (productNameLookup.TryGetValue(record.ProductName.ToLower(), out var prodByName))
                    {
                        record.ProductId = prodByName.Id;
                        matchedProductIds.Add(prodByName.Id);
                    }
                    else
                    {
                        unmatchedProductCodes.Add(record.ProductCode);
                    }
                }

                // Auto-match customer
                if (!string.IsNullOrEmpty(record.CustomerCode))
                {
                    var code = record.CustomerCode.ToLower();
                    if (customerCodeLookup.TryGetValue(code, out var customer))
                    {
                        record.CustomerId = customer.Id;
                        matchedCustomerIds.Add(customer.Id);
                    }
                    else if (!string.IsNullOrEmpty(record.CustomerName) &&
                             customerNameLookup.TryGetValue(record.CustomerName.ToLower(), out var custByName))
                    {
                        record.CustomerId = custByName.Id;
                        matchedCustomerIds.Add(custByName.Id);
                    }
                    else
                    {
                        unmatchedCustomerCodes.Add(record.CustomerCode);
                    }
                }

                salesRecords.Add(record);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.ErrorCount++;
                result.Errors.Add($"Row {i + 1}: {ex.Message}");
            }
        }

        // Batch insert sales records
        if (salesRecords.Count > 0)
            await _unitOfWork.WholesalerSalesRecords.AddRangeAsync(salesRecords, ct);

        await _unitOfWork.SaveChangesAsync(ct);

        result.MatchedProducts = matchedProductIds.Count;
        result.MatchedCustomers = matchedCustomerIds.Count;
        result.UnmatchedProducts = unmatchedProductCodes.Count;
        result.UnmatchedCustomers = unmatchedCustomerCodes.Count;

        return result;
    }

    private static WholesalerSalesRecord MapRowToSalesRecord(
        Dictionary<string, string> row, Dictionary<string, string>? mapping, int importId)
    {
        string GetValue(string field)
        {
            // Check mapped column name first, then raw field name
            if (mapping != null && mapping.TryGetValue(field, out var mappedCol))
            {
                if (row.TryGetValue(mappedCol, out var val)) return val;
            }
            if (row.TryGetValue(field, out var direct)) return direct;
            // Case-insensitive fallback
            var key = row.Keys.FirstOrDefault(k => k.Equals(field, StringComparison.OrdinalIgnoreCase));
            return key != null ? row[key] : string.Empty;
        }

        var record = new WholesalerSalesRecord
        {
            ImportId = importId,
            ProductCode = GetValue("ProductCode"),
            ProductName = GetValue("ProductName"),
            CustomerCode = GetValue("CustomerCode"),
            CustomerName = GetValue("CustomerName"),
            InvoiceNumber = GetValue("InvoiceNumber")
        };

        if (decimal.TryParse(GetValue("Quantity"), NumberStyles.Any, CultureInfo.InvariantCulture, out var qty))
            record.Quantity = qty;
        if (decimal.TryParse(GetValue("UnitPrice"), NumberStyles.Any, CultureInfo.InvariantCulture, out var price))
            record.UnitPrice = price;
        if (decimal.TryParse(GetValue("TotalAmount"), NumberStyles.Any, CultureInfo.InvariantCulture, out var total))
            record.TotalAmount = total;
        else
            record.TotalAmount = record.Quantity * record.UnitPrice;

        if (DateTime.TryParse(GetValue("InvoiceDate"), CultureInfo.InvariantCulture, DateTimeStyles.None, out var invDate))
            record.InvoiceDate = invDate;

        return record;
    }

    private async Task UpdateImportMatchCounts(int importId, CancellationToken ct)
    {
        var import = await _unitOfWork.WholesalerDataImports.GetByIdAsync(importId, ct);
        if (import == null) return;

        var records = await _unitOfWork.WholesalerSalesRecords.FindAsync(r => r.ImportId == importId, ct);
        import.MatchedProductCount = records.Count(r => r.ProductId.HasValue);
        import.MatchedCustomerCount = records.Count(r => r.CustomerId.HasValue);
        import.UnmatchedProductCount = records.Count(r => !r.ProductId.HasValue);
        import.UnmatchedCustomerCount = records.Count(r => !r.CustomerId.HasValue);

        await _unitOfWork.WholesalerDataImports.UpdateAsync(import, ct);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private static WholesalerDataImportDto MapImportToDto(WholesalerDataImport import)
    {
        return new WholesalerDataImportDto
        {
            Id = import.Id,
            WholesalerId = import.WholesalerId,
            WholesalerName = import.WholesalerName,
            FileName = import.FileName,
            ImportDate = import.ImportDate,
            Period = import.Period,
            Status = import.Status,
            RecordCount = import.RecordCount,
            ErrorCount = import.ErrorCount,
            MatchedProductCount = import.MatchedProductCount,
            MatchedCustomerCount = import.MatchedCustomerCount,
            UnmatchedProductCount = import.UnmatchedProductCount,
            UnmatchedCustomerCount = import.UnmatchedCustomerCount,
            Notes = import.Notes,
            CreatedAt = import.CreatedAt
        };
    }

    private static WholesalerSalesRecordDto MapSalesRecordToDto(WholesalerSalesRecord record)
    {
        return new WholesalerSalesRecordDto
        {
            Id = record.Id,
            ImportId = record.ImportId,
            ProductCode = record.ProductCode,
            ProductName = record.ProductName,
            CustomerCode = record.CustomerCode,
            CustomerName = record.CustomerName,
            Quantity = record.Quantity,
            UnitPrice = record.UnitPrice,
            TotalAmount = record.TotalAmount,
            InvoiceDate = record.InvoiceDate,
            InvoiceNumber = record.InvoiceNumber,
            ProductId = record.ProductId,
            MatchedProductName = record.Product?.Name,
            CustomerId = record.CustomerId,
            MatchedCustomerName = record.Customer?.FullName,
            IsManuallyMatched = record.IsManuallyMatched
        };
    }

    private static WholesalerStockRecordDto MapStockRecordToDto(WholesalerStockRecord record)
    {
        return new WholesalerStockRecordDto
        {
            Id = record.Id,
            WholesalerId = record.WholesalerId,
            WholesalerName = record.Wholesaler?.FullName,
            ProductId = record.ProductId,
            ProductCode = record.ProductCode,
            ProductName = record.ProductName,
            Quantity = record.Quantity,
            ReportDate = record.ReportDate
        };
    }

    #endregion
}
