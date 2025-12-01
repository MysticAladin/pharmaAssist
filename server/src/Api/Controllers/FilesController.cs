using Application.DTOs.Files;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileService _fileService;
    private readonly ILogger<FilesController> _logger;

    public FilesController(IFileService fileService, ILogger<FilesController> logger)
    {
        _fileService = fileService;
        _logger = logger;
    }

    /// <summary>
    /// Upload a single file
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
    public async Task<ActionResult<FileUploadResultDto>> UploadFile(
        IFormFile file,
        [FromForm] string entityType,
        [FromForm] int entityId,
        [FromForm] int category,
        [FromForm] string? description = null,
        [FromForm] string? alt = null,
        [FromForm] bool isPublic = false,
        [FromForm] int displayOrder = 0)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new FileUploadResultDto { Success = false, Message = "No file provided" });
        }

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);

        var dto = new FileUploadDto
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            Content = memoryStream.ToArray(),
            EntityType = entityType,
            EntityId = entityId,
            Category = category,
            Description = description,
            Alt = alt,
            IsPublic = isPublic,
            DisplayOrder = displayOrder
        };

        var result = await _fileService.UploadFileAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Upload multiple files
    /// </summary>
    [HttpPost("upload-multiple")]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50MB total
    public async Task<ActionResult<MultiFileUploadResultDto>> UploadMultipleFiles(
        IFormFileCollection files,
        [FromForm] string entityType,
        [FromForm] int entityId,
        [FromForm] int category,
        [FromForm] bool isPublic = false)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new MultiFileUploadResultDto { Success = false, Errors = ["No files provided"] });
        }

        var uploadDtos = new List<FileUploadDto>();
        int order = 0;

        foreach (var file in files)
        {
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);

            uploadDtos.Add(new FileUploadDto
            {
                FileName = file.FileName,
                ContentType = file.ContentType,
                Content = memoryStream.ToArray(),
                EntityType = entityType,
                EntityId = entityId,
                Category = category,
                IsPublic = isPublic,
                DisplayOrder = order++
            });
        }

        var result = await _fileService.UploadFilesAsync(uploadDtos);
        return Ok(result);
    }

    /// <summary>
    /// Get file by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FileAttachmentDto>> GetFile(int id)
    {
        var file = await _fileService.GetFileByIdAsync(id);
        if (file == null)
        {
            return NotFound();
        }
        return Ok(file);
    }

    /// <summary>
    /// Get files with pagination and filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetFiles([FromQuery] FileQueryParams queryParams)
    {
        var result = await _fileService.GetFilesAsync(queryParams);
        return Ok(result);
    }

    /// <summary>
    /// Get files by entity
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId}")]
    public async Task<ActionResult<IEnumerable<FileAttachmentDto>>> GetFilesByEntity(string entityType, int entityId)
    {
        var files = await _fileService.GetFilesByEntityAsync(entityType, entityId);
        return Ok(files);
    }

    /// <summary>
    /// Download a file
    /// </summary>
    [HttpGet("{id}/download")]
    [AllowAnonymous] // Public files can be downloaded without auth
    public async Task<IActionResult> DownloadFile(int id)
    {
        var file = await _fileService.GetFileByIdAsync(id);
        if (file == null)
        {
            return NotFound();
        }

        // Check if file is public or user is authenticated
        if (!file.IsPublic && !User.Identity?.IsAuthenticated == true)
        {
            return Unauthorized();
        }

        var result = await _fileService.DownloadFileAsync(id);
        if (result == null)
        {
            return NotFound();
        }

        return File(result.Value.Content, result.Value.ContentType, result.Value.FileName);
    }

    /// <summary>
    /// Delete a file
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteFile(int id)
    {
        var success = await _fileService.DeleteFileAsync(id);
        if (!success)
        {
            return NotFound();
        }
        return NoContent();
    }

    /// <summary>
    /// Delete all files for an entity
    /// </summary>
    [HttpDelete("entity/{entityType}/{entityId}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteFilesByEntity(string entityType, int entityId)
    {
        await _fileService.DeleteFilesByEntityAsync(entityType, entityId);
        return NoContent();
    }

    /// <summary>
    /// Update file display order
    /// </summary>
    [HttpPatch("{id}/order")]
    public async Task<IActionResult> UpdateFileOrder(int id, [FromBody] int displayOrder)
    {
        var success = await _fileService.UpdateFileOrderAsync(id, displayOrder);
        if (!success)
        {
            return NotFound();
        }
        return NoContent();
    }

    /// <summary>
    /// Set display order for multiple files
    /// </summary>
    [HttpPatch("order")]
    public async Task<IActionResult> SetFilesOrder([FromBody] Dictionary<int, int> fileOrders)
    {
        await _fileService.SetFilesOrderAsync(fileOrders);
        return NoContent();
    }
}
