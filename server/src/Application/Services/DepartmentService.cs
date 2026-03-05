using Application.DTOs.Common;
using Application.DTOs.Departments;
using Application.Interfaces;
using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IRepository<Department> _departmentRepo;
    private readonly IRepository<Customer> _customerRepo;
    private readonly IRepository<Physician> _physicianRepo;

    public DepartmentService(
        IRepository<Department> departmentRepo,
        IRepository<Customer> customerRepo,
        IRepository<Physician> physicianRepo)
    {
        _departmentRepo = departmentRepo;
        _customerRepo = customerRepo;
        _physicianRepo = physicianRepo;
    }

    public async Task<ApiResponse<List<DepartmentDto>>> GetByCustomerAsync(int customerId, CancellationToken ct = default)
    {
        var departments = await _departmentRepo.AsQueryable()
            .Where(d => d.CustomerId == customerId && !d.IsDeleted)
            .Include(d => d.HeadPhysician)
            .Include(d => d.Customer)
            .OrderBy(d => d.SortOrder)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                CustomerId = d.CustomerId,
                CustomerName = d.Customer.CompanyName ?? (d.Customer.FirstName + " " + d.Customer.LastName),
                Name = d.Name,
                NameLocal = d.NameLocal,
                Floor = d.Floor,
                HeadPhysicianId = d.HeadPhysicianId,
                HeadPhysicianName = d.HeadPhysician != null ? d.HeadPhysician.FullName : null,
                ContactPhone = d.ContactPhone,
                ContactEmail = d.ContactEmail,
                IsActive = d.IsActive,
                SortOrder = d.SortOrder,
                PhysicianCount = d.Physicians.Count(p => !p.IsDeleted),
                CreatedAt = d.CreatedAt
            })
            .ToListAsync(ct);

        return ApiResponse<List<DepartmentDto>>.Ok(departments);
    }

    public async Task<ApiResponse<DepartmentDetailDto>> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var dept = await _departmentRepo.AsQueryable()
            .Where(d => d.Id == id && !d.IsDeleted)
            .Include(d => d.Customer)
            .Include(d => d.HeadPhysician)
            .Include(d => d.Physicians.Where(p => !p.IsDeleted))
            .FirstOrDefaultAsync(ct);

        if (dept == null)
            return ApiResponse<DepartmentDetailDto>.Fail("Department not found");

        var dto = new DepartmentDetailDto
        {
            Id = dept.Id,
            CustomerId = dept.CustomerId,
            CustomerName = dept.Customer.CompanyName ?? (dept.Customer.FirstName + " " + dept.Customer.LastName),
            Name = dept.Name,
            NameLocal = dept.NameLocal,
            Floor = dept.Floor,
            HeadPhysicianId = dept.HeadPhysicianId,
            HeadPhysicianName = dept.HeadPhysician?.FullName,
            ContactPhone = dept.ContactPhone,
            ContactEmail = dept.ContactEmail,
            IsActive = dept.IsActive,
            SortOrder = dept.SortOrder,
            PhysicianCount = dept.Physicians.Count,
            CreatedAt = dept.CreatedAt,
            Physicians = dept.Physicians.Select(p => new PhysicianSummaryDto
            {
                Id = p.Id,
                FullName = p.FullName,
                Specialty = p.Specialty,
                SpecialtyName = p.Specialty.ToString(),
                KOLStatus = p.KOLStatus,
                IsActive = p.IsActive
            }).ToList()
        };

        return ApiResponse<DepartmentDetailDto>.Ok(dto);
    }

    public async Task<ApiResponse<DepartmentDto>> CreateAsync(CreateDepartmentRequest request, CancellationToken ct = default)
    {
        var customer = await _customerRepo.GetByIdAsync(request.CustomerId, ct);
        if (customer == null)
            return ApiResponse<DepartmentDto>.Fail("Customer not found");

        var entity = new Department
        {
            CustomerId = request.CustomerId,
            Name = request.Name,
            NameLocal = request.NameLocal,
            Floor = request.Floor,
            HeadPhysicianId = request.HeadPhysicianId,
            ContactPhone = request.ContactPhone,
            ContactEmail = request.ContactEmail,
            SortOrder = request.SortOrder
        };

        var created = await _departmentRepo.AddAsync(entity, ct);
        return ApiResponse<DepartmentDto>.Ok(new DepartmentDto
        {
            Id = created.Id,
            CustomerId = created.CustomerId,
            CustomerName = customer.CompanyName ?? (customer.FirstName + " " + customer.LastName),
            Name = created.Name,
            NameLocal = created.NameLocal,
            Floor = created.Floor,
            HeadPhysicianId = created.HeadPhysicianId,
            ContactPhone = created.ContactPhone,
            ContactEmail = created.ContactEmail,
            IsActive = created.IsActive,
            SortOrder = created.SortOrder,
            PhysicianCount = 0,
            CreatedAt = created.CreatedAt
        }, "Department created");
    }

    public async Task<ApiResponse<DepartmentDto>> UpdateAsync(UpdateDepartmentRequest request, CancellationToken ct = default)
    {
        var entity = await _departmentRepo.GetByIdAsync(request.Id, ct);
        if (entity == null)
            return ApiResponse<DepartmentDto>.Fail("Department not found");

        entity.Name = request.Name;
        entity.NameLocal = request.NameLocal;
        entity.Floor = request.Floor;
        entity.HeadPhysicianId = request.HeadPhysicianId;
        entity.ContactPhone = request.ContactPhone;
        entity.ContactEmail = request.ContactEmail;
        entity.SortOrder = request.SortOrder;

        await _departmentRepo.UpdateAsync(entity, ct);

        var customer = await _customerRepo.GetByIdAsync(entity.CustomerId, ct);
        return ApiResponse<DepartmentDto>.Ok(new DepartmentDto
        {
            Id = entity.Id,
            CustomerId = entity.CustomerId,
            CustomerName = customer?.CompanyName ?? (customer?.FirstName + " " + customer?.LastName),
            Name = entity.Name,
            NameLocal = entity.NameLocal,
            Floor = entity.Floor,
            HeadPhysicianId = entity.HeadPhysicianId,
            ContactPhone = entity.ContactPhone,
            ContactEmail = entity.ContactEmail,
            IsActive = entity.IsActive,
            SortOrder = entity.SortOrder,
            CreatedAt = entity.CreatedAt
        }, "Department updated");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _departmentRepo.GetByIdAsync(id, ct);
        if (entity == null)
            return ApiResponse<bool>.Fail("Department not found");

        await _departmentRepo.DeleteAsync(entity, ct);
        return ApiResponse<bool>.Ok(true, "Department deleted");
    }
}
