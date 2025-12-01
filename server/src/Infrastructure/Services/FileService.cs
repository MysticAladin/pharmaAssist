using Application.Common;
using Application.DTOs.Files;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class FileService : IFileService
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FileService> _logger;
    private readonly string _uploadsFolder;

    private static readonly HashSet<string> AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    private static readonly HashSet<string> AllowedDocumentExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".csv"];
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    public FileService(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        ILogger<FileService> logger)
    {
        _context = context;
        _environment = environment;
        _logger = logger;
        _uploadsFolder = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, "uploads");
        
        if (!Directory.Exists(_uploadsFolder))
        {
            Directory.CreateDirectory(_uploadsFolder);
        }
    }

    public async Task<FileUploadResultDto> UploadFileAsync(FileUploadDto dto)
    {
        try
        {
            // Validate file
            if (dto.Content == null || dto.Content.Length == 0)
            {
                return new FileUploadResultDto { Success = false, Message = "File content is empty" };
            }

            if (dto.Content.Length > MaxFileSizeBytes)
            {
                return new FileUploadResultDto { Success = false, Message = $"File size exceeds maximum allowed size of {MaxFileSizeBytes / 1024 / 1024}MB" };
            }

            var extension = Path.GetExtension(dto.FileName).ToLowerInvariant();
            if (!IsAllowedExtension(extension))
            {
                return new FileUploadResultDto { Success = false, Message = $"File extension '{extension}' is not allowed" };
            }

            // Generate unique file name
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var categoryFolder = GetCategoryFolder((FileCategory)dto.Category);
            var folderPath = Path.Combine(_uploadsFolder, categoryFolder, dto.EntityType.ToLowerInvariant());
            
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var filePath = Path.Combine(folderPath, uniqueFileName);
            var relativePath = Path.Combine("uploads", categoryFolder, dto.EntityType.ToLowerInvariant(), uniqueFileName);

            // Save file
            await File.WriteAllBytesAsync(filePath, dto.Content);

            // Create thumbnail for images
            string? thumbnailPath = null;
            if (IsImageExtension(extension))
            {
                // For now, just use the same image as thumbnail
                // In production, you would resize the image
                thumbnailPath = relativePath;
            }

            // Save to database
            var fileAttachment = new FileAttachment
            {
                FileName = uniqueFileName,
                OriginalFileName = dto.FileName,
                ContentType = dto.ContentType,
                FileSize = dto.Content.Length,
                FilePath = relativePath,
                ThumbnailPath = thumbnailPath,
                EntityType = dto.EntityType,
                EntityId = dto.EntityId,
                Category = (FileCategory)dto.Category,
                Description = dto.Description,
                Alt = dto.Alt,
                IsPublic = dto.IsPublic,
                DisplayOrder = dto.DisplayOrder
            };

            _context.FileAttachments.Add(fileAttachment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("File uploaded: {FileName} for {EntityType}/{EntityId}", 
                dto.FileName, dto.EntityType, dto.EntityId);

            return new FileUploadResultDto
            {
                Success = true,
                Message = "File uploaded successfully",
                File = MapToDto(fileAttachment)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading file: {FileName}", dto.FileName);
            return new FileUploadResultDto { Success = false, Message = $"Error uploading file: {ex.Message}" };
        }
    }

    public async Task<MultiFileUploadResultDto> UploadFilesAsync(IEnumerable<FileUploadDto> files)
    {
        var result = new MultiFileUploadResultDto();
        var fileList = files.ToList();
        result.TotalFiles = fileList.Count;

        foreach (var file in fileList)
        {
            var uploadResult = await UploadFileAsync(file);
            if (uploadResult.Success && uploadResult.File != null)
            {
                result.SuccessfulUploads++;
                result.Files.Add(uploadResult.File);
            }
            else
            {
                result.FailedUploads++;
                result.Errors.Add($"{file.FileName}: {uploadResult.Message}");
            }
        }

        result.Success = result.FailedUploads == 0;
        return result;
    }

    public async Task<FileAttachmentDto?> GetFileByIdAsync(int id)
    {
        var file = await _context.FileAttachments.FindAsync(id);
        return file != null ? MapToDto(file) : null;
    }

    public async Task<PagedResult<FileAttachmentDto>> GetFilesAsync(FileQueryParams queryParams)
    {
        var query = _context.FileAttachments.AsQueryable();

        if (!string.IsNullOrEmpty(queryParams.EntityType))
            query = query.Where(f => f.EntityType == queryParams.EntityType);

        if (queryParams.EntityId.HasValue)
            query = query.Where(f => f.EntityId == queryParams.EntityId.Value);

        if (queryParams.Category.HasValue)
            query = query.Where(f => f.Category == (FileCategory)queryParams.Category.Value);

        if (queryParams.IsPublic.HasValue)
            query = query.Where(f => f.IsPublic == queryParams.IsPublic.Value);

        var totalCount = await query.CountAsync();
        
        var files = await query
            .OrderByDescending(f => f.CreatedAt)
            .ThenBy(f => f.DisplayOrder)
            .Skip((queryParams.Page - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync();

        return new PagedResult<FileAttachmentDto>
        {
            Items = files.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = queryParams.Page,
            PageSize = queryParams.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)queryParams.PageSize)
        };
    }

    public async Task<IEnumerable<FileAttachmentDto>> GetFilesByEntityAsync(string entityType, int entityId)
    {
        var files = await _context.FileAttachments
            .Where(f => f.EntityType == entityType && f.EntityId == entityId)
            .OrderBy(f => f.DisplayOrder)
            .ThenByDescending(f => f.CreatedAt)
            .ToListAsync();

        return files.Select(MapToDto);
    }

    public async Task<bool> DeleteFileAsync(int id)
    {
        var file = await _context.FileAttachments.FindAsync(id);
        if (file == null) return false;

        try
        {
            // Delete physical file
            var fullPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, file.FilePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }

            // Delete from database
            _context.FileAttachments.Remove(file);
            await _context.SaveChangesAsync();

            _logger.LogInformation("File deleted: {FileId} - {FileName}", id, file.OriginalFileName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file: {FileId}", id);
            return false;
        }
    }

    public async Task<bool> DeleteFilesByEntityAsync(string entityType, int entityId)
    {
        var files = await _context.FileAttachments
            .Where(f => f.EntityType == entityType && f.EntityId == entityId)
            .ToListAsync();

        foreach (var file in files)
        {
            var fullPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, file.FilePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        _context.FileAttachments.RemoveRange(files);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted {Count} files for {EntityType}/{EntityId}", files.Count, entityType, entityId);
        return true;
    }

    public async Task<byte[]?> GetFileContentAsync(int id)
    {
        var file = await _context.FileAttachments.FindAsync(id);
        if (file == null) return null;

        var fullPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, file.FilePath);
        if (!File.Exists(fullPath)) return null;

        return await File.ReadAllBytesAsync(fullPath);
    }

    public async Task<(byte[] Content, string ContentType, string FileName)?> DownloadFileAsync(int id)
    {
        var file = await _context.FileAttachments.FindAsync(id);
        if (file == null) return null;

        var fullPath = Path.Combine(_environment.WebRootPath ?? _environment.ContentRootPath, file.FilePath);
        if (!File.Exists(fullPath)) return null;

        var content = await File.ReadAllBytesAsync(fullPath);
        return (content, file.ContentType, file.OriginalFileName);
    }

    public async Task<bool> UpdateFileOrderAsync(int id, int displayOrder)
    {
        var file = await _context.FileAttachments.FindAsync(id);
        if (file == null) return false;

        file.DisplayOrder = displayOrder;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetFilesOrderAsync(Dictionary<int, int> fileOrders)
    {
        var fileIds = fileOrders.Keys.ToList();
        var files = await _context.FileAttachments
            .Where(f => fileIds.Contains(f.Id))
            .ToListAsync();

        foreach (var file in files)
        {
            if (fileOrders.TryGetValue(file.Id, out var order))
            {
                file.DisplayOrder = order;
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private FileAttachmentDto MapToDto(FileAttachment file)
    {
        return new FileAttachmentDto
        {
            Id = file.Id,
            FileName = file.FileName,
            OriginalFileName = file.OriginalFileName,
            ContentType = file.ContentType,
            FileSize = file.FileSize,
            FilePath = file.FilePath,
            ThumbnailPath = file.ThumbnailPath,
            EntityType = file.EntityType,
            EntityId = file.EntityId,
            Category = file.Category.ToString(),
            Description = file.Description,
            Alt = file.Alt,
            IsPublic = file.IsPublic,
            DisplayOrder = file.DisplayOrder,
            CreatedAt = file.CreatedAt,
            Url = $"/api/files/{file.Id}/download",
            ThumbnailUrl = file.ThumbnailPath != null ? $"/api/files/{file.Id}/thumbnail" : null
        };
    }

    private static bool IsAllowedExtension(string extension)
    {
        return AllowedImageExtensions.Contains(extension) || AllowedDocumentExtensions.Contains(extension);
    }

    private static bool IsImageExtension(string extension)
    {
        return AllowedImageExtensions.Contains(extension);
    }

    private static string GetCategoryFolder(FileCategory category)
    {
        return category switch
        {
            FileCategory.ProductImage => "products",
            FileCategory.ProductDocument => "product-docs",
            FileCategory.PrescriptionScan => "prescriptions",
            FileCategory.CustomerDocument => "customers",
            FileCategory.ManufacturerLogo => "manufacturers",
            FileCategory.InvoiceDocument => "invoices",
            FileCategory.ReportDocument => "reports",
            _ => "other"
        };
    }
}
