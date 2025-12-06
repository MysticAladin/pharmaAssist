using Application.DTOs.Targets;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Api.Controllers;

/// <summary>
/// API endpoints for budget management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BudgetsController> _logger;

    public BudgetsController(ApplicationDbContext context, ILogger<BudgetsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all budgets with optional filters
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<IEnumerable<BudgetDto>>> GetBudgets(
        [FromQuery] int? year = null,
        [FromQuery] BudgetType? type = null,
        [FromQuery] BudgetStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Budgets
            .Include(b => b.Category)
            .Include(b => b.Manufacturer)
            .Include(b => b.ResponsibleUser)
            .AsNoTracking();

        if (year.HasValue)
            query = query.Where(b => b.Year == year.Value);
        
        if (type.HasValue)
            query = query.Where(b => b.BudgetType == type.Value);
        
        if (status.HasValue)
            query = query.Where(b => b.Status == status.Value);

        var budgets = await query
            .OrderByDescending(b => b.Year)
            .ThenByDescending(b => b.Month ?? 0)
            .ToListAsync(cancellationToken);

        return Ok(budgets.Select(MapToDto));
    }

    /// <summary>
    /// Get budget summary dashboard
    /// </summary>
    [HttpGet("summary")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<BudgetSummaryDto>> GetBudgetSummary(
        [FromQuery] int? year = null,
        CancellationToken cancellationToken = default)
    {
        year ??= DateTime.UtcNow.Year;

        var budgets = await _context.Budgets
            .Where(b => b.Year == year.Value && b.Status == BudgetStatus.Approved)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var summary = new BudgetSummaryDto
        {
            TotalBudgets = budgets.Count,
            TotalAllocated = budgets.Sum(b => b.AllocatedAmount),
            TotalSpent = budgets.Sum(b => b.SpentAmount),
            TotalRemaining = budgets.Sum(b => b.RemainingAmount),
            OverallUtilizationPercentage = budgets.Sum(b => b.AllocatedAmount) > 0
                ? Math.Round((budgets.Sum(b => b.SpentAmount) / budgets.Sum(b => b.AllocatedAmount)) * 100, 2)
                : 0,
            OverBudgetCount = budgets.Count(b => b.IsOverBudget),
            ByType = budgets
                .GroupBy(b => b.BudgetType)
                .Select(g => new BudgetDto
                {
                    BudgetTypeName = GetBudgetTypeName(g.Key),
                    AllocatedAmount = g.Sum(b => b.AllocatedAmount),
                    SpentAmount = g.Sum(b => b.SpentAmount),
                    RemainingAmount = g.Sum(b => b.RemainingAmount),
                    UtilizationPercentage = g.Sum(b => b.AllocatedAmount) > 0
                        ? Math.Round((g.Sum(b => b.SpentAmount) / g.Sum(b => b.AllocatedAmount)) * 100, 2)
                        : 0
                })
                .ToList()
        };

        return Ok(summary);
    }

    /// <summary>
    /// Get a specific budget
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<BudgetDto>> GetBudget(int id, CancellationToken cancellationToken)
    {
        var budget = await _context.Budgets
            .Include(b => b.Category)
            .Include(b => b.Manufacturer)
            .Include(b => b.ResponsibleUser)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        if (budget == null)
            return NotFound();

        return Ok(MapToDto(budget));
    }

    /// <summary>
    /// Create a new budget
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<BudgetDto>> CreateBudget(
        [FromBody] CreateBudgetDto dto,
        CancellationToken cancellationToken)
    {
        var budget = new Budget
        {
            Name = dto.Name,
            Description = dto.Description,
            BudgetType = dto.BudgetType,
            CategoryId = dto.CategoryId,
            ManufacturerId = dto.ManufacturerId,
            UserId = dto.UserId,
            Year = dto.Year,
            Month = dto.Month,
            Quarter = dto.Quarter,
            AllocatedAmount = dto.AllocatedAmount,
            Status = BudgetStatus.Draft
        };

        _context.Budgets.Add(budget);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created budget {BudgetName} with ID {BudgetId}", budget.Name, budget.Id);

        return CreatedAtAction(nameof(GetBudget), new { id = budget.Id }, MapToDto(budget));
    }

    /// <summary>
    /// Update a budget
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<BudgetDto>> UpdateBudget(
        int id,
        [FromBody] CreateBudgetDto dto,
        CancellationToken cancellationToken)
    {
        var budget = await _context.Budgets.FindAsync([id], cancellationToken);

        if (budget == null)
            return NotFound();

        if (budget.Status == BudgetStatus.Closed)
            return BadRequest(new { message = "Cannot modify a closed budget" });

        budget.Name = dto.Name;
        budget.Description = dto.Description;
        budget.BudgetType = dto.BudgetType;
        budget.CategoryId = dto.CategoryId;
        budget.ManufacturerId = dto.ManufacturerId;
        budget.UserId = dto.UserId;
        budget.Year = dto.Year;
        budget.Month = dto.Month;
        budget.Quarter = dto.Quarter;
        budget.AllocatedAmount = dto.AllocatedAmount;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToDto(budget));
    }

    /// <summary>
    /// Submit budget for approval
    /// </summary>
    [HttpPost("{id}/submit")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<IActionResult> SubmitBudget(int id, CancellationToken cancellationToken)
    {
        var budget = await _context.Budgets.FindAsync([id], cancellationToken);

        if (budget == null)
            return NotFound();

        if (budget.Status != BudgetStatus.Draft)
            return BadRequest(new { message = "Only draft budgets can be submitted" });

        budget.Status = BudgetStatus.Submitted;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Budget submitted for approval" });
    }

    /// <summary>
    /// Approve a budget
    /// </summary>
    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> ApproveBudget(int id, CancellationToken cancellationToken)
    {
        var budget = await _context.Budgets.FindAsync([id], cancellationToken);

        if (budget == null)
            return NotFound();

        if (budget.Status != BudgetStatus.Submitted)
            return BadRequest(new { message = "Only submitted budgets can be approved" });

        budget.Status = BudgetStatus.Approved;
        budget.ApprovedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        budget.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Budget {BudgetId} approved by {ApprovedBy}", id, budget.ApprovedBy);

        return Ok(new { message = "Budget approved" });
    }

    /// <summary>
    /// Reject a budget
    /// </summary>
    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> RejectBudget(int id, CancellationToken cancellationToken)
    {
        var budget = await _context.Budgets.FindAsync([id], cancellationToken);

        if (budget == null)
            return NotFound();

        if (budget.Status != BudgetStatus.Submitted)
            return BadRequest(new { message = "Only submitted budgets can be rejected" });

        budget.Status = BudgetStatus.Rejected;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Budget rejected" });
    }

    /// <summary>
    /// Close a budget
    /// </summary>
    [HttpPost("{id}/close")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> CloseBudget(int id, CancellationToken cancellationToken)
    {
        var budget = await _context.Budgets.FindAsync([id], cancellationToken);

        if (budget == null)
            return NotFound();

        budget.Status = BudgetStatus.Closed;
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Budget closed" });
    }

    /// <summary>
    /// Delete a budget
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBudget(int id, CancellationToken cancellationToken)
    {
        var budget = await _context.Budgets.FindAsync([id], cancellationToken);

        if (budget == null)
            return NotFound();

        if (budget.Status == BudgetStatus.Approved || budget.Status == BudgetStatus.Closed)
            return BadRequest(new { message = "Cannot delete approved or closed budgets" });

        _context.Budgets.Remove(budget);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    #region Expenses

    /// <summary>
    /// Get expenses for a budget
    /// </summary>
    [HttpGet("{id}/expenses")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<IEnumerable<BudgetExpenseDto>>> GetBudgetExpenses(
        int id,
        CancellationToken cancellationToken)
    {
        var expenses = await _context.BudgetExpenses
            .Where(e => e.BudgetId == id)
            .OrderByDescending(e => e.ExpenseDate)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return Ok(expenses.Select(MapExpenseToDto));
    }

    /// <summary>
    /// Add an expense to a budget
    /// </summary>
    [HttpPost("{id}/expenses")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<ActionResult<BudgetExpenseDto>> AddExpense(
        int id,
        [FromBody] CreateBudgetExpenseDto dto,
        CancellationToken cancellationToken)
    {
        var budget = await _context.Budgets.FindAsync([id], cancellationToken);

        if (budget == null)
            return NotFound();

        if (budget.Status != BudgetStatus.Approved)
            return BadRequest(new { message = "Can only add expenses to approved budgets" });

        var expense = new BudgetExpense
        {
            BudgetId = id,
            Description = dto.Description,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate,
            ReferenceNumber = dto.ReferenceNumber,
            ExpenseCategory = dto.ExpenseCategory,
            Notes = dto.Notes,
            OrderId = dto.OrderId,
            PromotionId = dto.PromotionId,
            RecordedBy = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        };

        _context.BudgetExpenses.Add(expense);

        // Update spent amount
        budget.SpentAmount += dto.Amount;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Added expense of {Amount} KM to budget {BudgetId}",
            dto.Amount, id);

        return CreatedAtAction(nameof(GetBudgetExpenses), new { id }, MapExpenseToDto(expense));
    }

    /// <summary>
    /// Delete an expense
    /// </summary>
    [HttpDelete("expenses/{expenseId}")]
    [Authorize(Roles = "Admin,Finance")]
    public async Task<IActionResult> DeleteExpense(int expenseId, CancellationToken cancellationToken)
    {
        var expense = await _context.BudgetExpenses
            .Include(e => e.Budget)
            .FirstOrDefaultAsync(e => e.Id == expenseId, cancellationToken);

        if (expense == null)
            return NotFound();

        if (expense.Budget.Status == BudgetStatus.Closed)
            return BadRequest(new { message = "Cannot delete expenses from closed budgets" });

        // Update spent amount
        expense.Budget.SpentAmount -= expense.Amount;

        _context.BudgetExpenses.Remove(expense);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    #endregion

    #region Helpers

    private static BudgetDto MapToDto(Budget budget) => new()
    {
        Id = budget.Id,
        Name = budget.Name,
        Description = budget.Description,
        BudgetType = budget.BudgetType,
        BudgetTypeName = GetBudgetTypeName(budget.BudgetType),
        CategoryId = budget.CategoryId,
        CategoryName = budget.Category?.Name,
        ManufacturerId = budget.ManufacturerId,
        ManufacturerName = budget.Manufacturer?.Name,
        UserId = budget.UserId,
        UserName = budget.ResponsibleUser != null 
            ? $"{budget.ResponsibleUser.FirstName} {budget.ResponsibleUser.LastName}" 
            : null,
        Year = budget.Year,
        Month = budget.Month,
        Quarter = budget.Quarter,
        PeriodDisplay = GetPeriodDisplay(budget.Year, budget.Month, budget.Quarter),
        AllocatedAmount = budget.AllocatedAmount,
        SpentAmount = budget.SpentAmount,
        RemainingAmount = budget.RemainingAmount,
        UtilizationPercentage = budget.UtilizationPercentage,
        IsOverBudget = budget.IsOverBudget,
        Status = budget.Status,
        StatusName = GetStatusName(budget.Status),
        ApprovedBy = budget.ApprovedBy,
        ApprovedAt = budget.ApprovedAt,
        CreatedAt = budget.CreatedAt
    };

    private static BudgetExpenseDto MapExpenseToDto(BudgetExpense expense) => new()
    {
        Id = expense.Id,
        BudgetId = expense.BudgetId,
        Description = expense.Description,
        Amount = expense.Amount,
        ExpenseDate = expense.ExpenseDate,
        ReferenceNumber = expense.ReferenceNumber,
        ExpenseCategory = expense.ExpenseCategory,
        ExpenseCategoryName = GetExpenseCategoryName(expense.ExpenseCategory),
        Notes = expense.Notes,
        CreatedBy = expense.RecordedBy,
        OrderId = expense.OrderId,
        PromotionId = expense.PromotionId,
        CreatedAt = expense.CreatedAt
    };

    private static string GetBudgetTypeName(BudgetType type) => type switch
    {
        BudgetType.Marketing => "Marketing",
        BudgetType.Promotions => "Promotions",
        BudgetType.Samples => "Samples (FOC)",
        BudgetType.Travel => "Travel",
        BudgetType.Training => "Training",
        BudgetType.Events => "Events",
        BudgetType.Other => "Other",
        _ => type.ToString()
    };

    private static string GetStatusName(BudgetStatus status) => status switch
    {
        BudgetStatus.Draft => "Draft",
        BudgetStatus.Submitted => "Submitted",
        BudgetStatus.Approved => "Approved",
        BudgetStatus.Rejected => "Rejected",
        BudgetStatus.Closed => "Closed",
        _ => status.ToString()
    };

    private static string GetExpenseCategoryName(ExpenseCategory category) => category switch
    {
        ExpenseCategory.Advertising => "Advertising",
        ExpenseCategory.Discount => "Discount",
        ExpenseCategory.Sample => "Sample",
        ExpenseCategory.Travel => "Travel",
        ExpenseCategory.Accommodation => "Accommodation",
        ExpenseCategory.Meals => "Meals",
        ExpenseCategory.Materials => "Materials",
        ExpenseCategory.EventFees => "Event Fees",
        ExpenseCategory.Consulting => "Consulting",
        ExpenseCategory.Other => "Other",
        _ => category.ToString()
    };

    private static string GetPeriodDisplay(int year, int? month, int? quarter)
    {
        if (month.HasValue)
            return $"{year}-{month:D2}";
        if (quarter.HasValue)
            return $"{year} Q{quarter}";
        return year.ToString();
    }

    #endregion
}
