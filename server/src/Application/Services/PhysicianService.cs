using Application.DTOs.Common;
using Application.DTOs.Physicians;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public class PhysicianService : IPhysicianService
{
    private readonly IRepository<Physician> _physicianRepo;
    private readonly IRepository<Customer> _customerRepo;
    private readonly IRepository<Department> _departmentRepo;

    public PhysicianService(
        IRepository<Physician> physicianRepo,
        IRepository<Customer> customerRepo,
        IRepository<Department> departmentRepo)
    {
        _physicianRepo = physicianRepo;
        _customerRepo = customerRepo;
        _departmentRepo = departmentRepo;
    }

    public async Task<PagedResponse<PhysicianDto>> GetPagedAsync(int? institutionId, int? departmentId,
        string? search, int page = 1, int pageSize = 10, CancellationToken ct = default)
    {
        var query = _physicianRepo.AsQueryable().Where(p => !p.IsDeleted);

        if (institutionId.HasValue)
            query = query.Where(p => p.InstitutionId == institutionId.Value);

        if (departmentId.HasValue)
            query = query.Where(p => p.DepartmentId == departmentId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => p.FullName.ToLower().Contains(s)
                || (p.LicenseNumber != null && p.LicenseNumber.ToLower().Contains(s))
                || (p.Email != null && p.Email.ToLower().Contains(s)));
        }

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .Include(p => p.Institution)
            .Include(p => p.Department)
            .OrderBy(p => p.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => MapToDto(p))
            .ToListAsync(ct);

        return PagedResponse<PhysicianDto>.Create(items, totalCount, page, pageSize);
    }

    public async Task<ApiResponse<PhysicianDto>> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var physician = await _physicianRepo.AsQueryable()
            .Where(p => p.Id == id && !p.IsDeleted)
            .Include(p => p.Institution)
            .Include(p => p.Department)
            .Include(p => p.Prescriptions.Where(pr => !pr.IsDeleted))
            .FirstOrDefaultAsync(ct);

        if (physician == null)
            return ApiResponse<PhysicianDto>.Fail("Physician not found");

        var dto = MapToDto(physician);
        dto.PrescriptionCount = physician.Prescriptions.Count;
        return ApiResponse<PhysicianDto>.Ok(dto);
    }

    public async Task<ApiResponse<List<PhysicianDto>>> GetByInstitutionAsync(int institutionId, CancellationToken ct = default)
    {
        var physicians = await _physicianRepo.AsQueryable()
            .Where(p => p.InstitutionId == institutionId && !p.IsDeleted)
            .Include(p => p.Institution)
            .Include(p => p.Department)
            .OrderBy(p => p.FullName)
            .Select(p => MapToDto(p))
            .ToListAsync(ct);

        return ApiResponse<List<PhysicianDto>>.Ok(physicians);
    }

    public async Task<ApiResponse<List<PhysicianDto>>> GetByDepartmentAsync(int departmentId, CancellationToken ct = default)
    {
        var physicians = await _physicianRepo.AsQueryable()
            .Where(p => p.DepartmentId == departmentId && !p.IsDeleted)
            .Include(p => p.Institution)
            .Include(p => p.Department)
            .OrderBy(p => p.FullName)
            .Select(p => MapToDto(p))
            .ToListAsync(ct);

        return ApiResponse<List<PhysicianDto>>.Ok(physicians);
    }

    public async Task<ApiResponse<PhysicianDto>> CreateAsync(CreatePhysicianRequest request, CancellationToken ct = default)
    {
        var institution = await _customerRepo.GetByIdAsync(request.InstitutionId, ct);
        if (institution == null)
            return ApiResponse<PhysicianDto>.Fail("Institution not found");

        if (request.DepartmentId.HasValue)
        {
            var dept = await _departmentRepo.GetByIdAsync(request.DepartmentId.Value, ct);
            if (dept == null)
                return ApiResponse<PhysicianDto>.Fail("Department not found");
        }

        var entity = new Physician
        {
            FullName = request.FullName,
            FullNameLocal = request.FullNameLocal,
            Specialty = request.Specialty,
            SpecialtyOther = request.SpecialtyOther,
            InstitutionId = request.InstitutionId,
            DepartmentId = request.DepartmentId,
            LicenseNumber = request.LicenseNumber,
            Phone = request.Phone,
            Email = request.Email,
            KOLStatus = request.KOLStatus,
            Notes = request.Notes
        };

        var created = await _physicianRepo.AddAsync(entity, ct);

        // Reload with includes
        var result = await _physicianRepo.AsQueryable()
            .Where(p => p.Id == created.Id)
            .Include(p => p.Institution)
            .Include(p => p.Department)
            .FirstAsync(ct);

        return ApiResponse<PhysicianDto>.Ok(MapToDto(result), "Physician created");
    }

    public async Task<ApiResponse<PhysicianDto>> UpdateAsync(UpdatePhysicianRequest request, CancellationToken ct = default)
    {
        var entity = await _physicianRepo.GetByIdAsync(request.Id, ct);
        if (entity == null)
            return ApiResponse<PhysicianDto>.Fail("Physician not found");

        entity.FullName = request.FullName;
        entity.FullNameLocal = request.FullNameLocal;
        entity.Specialty = request.Specialty;
        entity.SpecialtyOther = request.SpecialtyOther;
        entity.InstitutionId = request.InstitutionId;
        entity.DepartmentId = request.DepartmentId;
        entity.LicenseNumber = request.LicenseNumber;
        entity.Phone = request.Phone;
        entity.Email = request.Email;
        entity.KOLStatus = request.KOLStatus;
        entity.Notes = request.Notes;

        await _physicianRepo.UpdateAsync(entity, ct);

        var result = await _physicianRepo.AsQueryable()
            .Where(p => p.Id == entity.Id)
            .Include(p => p.Institution)
            .Include(p => p.Department)
            .FirstAsync(ct);

        return ApiResponse<PhysicianDto>.Ok(MapToDto(result), "Physician updated");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _physicianRepo.GetByIdAsync(id, ct);
        if (entity == null)
            return ApiResponse<bool>.Fail("Physician not found");

        await _physicianRepo.DeleteAsync(entity, ct);
        return ApiResponse<bool>.Ok(true, "Physician deleted");
    }

    private static PhysicianDto MapToDto(Physician p) => new()
    {
        Id = p.Id,
        FullName = p.FullName,
        FullNameLocal = p.FullNameLocal,
        Specialty = p.Specialty,
        SpecialtyName = p.Specialty.ToString(),
        SpecialtyOther = p.SpecialtyOther,
        InstitutionId = p.InstitutionId,
        InstitutionName = p.Institution?.CompanyName ?? (p.Institution != null ? p.Institution.FirstName + " " + p.Institution.LastName : ""),
        DepartmentId = p.DepartmentId,
        DepartmentName = p.Department?.Name,
        LicenseNumber = p.LicenseNumber,
        Phone = p.Phone,
        Email = p.Email,
        KOLStatus = p.KOLStatus,
        KOLStatusName = p.KOLStatus.ToString(),
        Notes = p.Notes,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt
    };
}
