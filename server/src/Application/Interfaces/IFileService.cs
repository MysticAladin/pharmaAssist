using Application.Common;
using Application.DTOs.Files;

namespace Application.Interfaces;

public interface IFileService
{
    Task<FileUploadResultDto> UploadFileAsync(FileUploadDto dto);
    Task<MultiFileUploadResultDto> UploadFilesAsync(IEnumerable<FileUploadDto> files);
    Task<FileAttachmentDto?> GetFileByIdAsync(int id);
    Task<PagedResult<FileAttachmentDto>> GetFilesAsync(FileQueryParams queryParams);
    Task<IEnumerable<FileAttachmentDto>> GetFilesByEntityAsync(string entityType, int entityId);
    Task<bool> DeleteFileAsync(int id);
    Task<bool> DeleteFilesByEntityAsync(string entityType, int entityId);
    Task<byte[]?> GetFileContentAsync(int id);
    Task<(byte[] Content, string ContentType, string FileName)?> DownloadFileAsync(int id);
    Task<bool> UpdateFileOrderAsync(int id, int displayOrder);
    Task<bool> SetFilesOrderAsync(Dictionary<int, int> fileOrders);
}
