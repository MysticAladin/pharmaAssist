using Application.DTOs.Common;
using FluentValidation;

namespace Application.Validators.Common;

/// <summary>
/// Validator for PaginationQuery
/// </summary>
public class PaginationQueryValidator : AbstractValidator<PaginationQuery>
{
    public PaginationQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0.");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("Page size must be greater than 0.")
            .LessThanOrEqualTo(100).WithMessage("Page size cannot exceed 100.");

        RuleFor(x => x.SortBy)
            .MaximumLength(50).WithMessage("Sort field cannot exceed 50 characters.")
            .Matches(@"^[a-zA-Z_]+$").WithMessage("Sort field can only contain letters and underscores.")
            .When(x => !string.IsNullOrEmpty(x.SortBy));

        RuleFor(x => x.SearchTerm)
            .MaximumLength(100).WithMessage("Search term cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.SearchTerm));
    }
}
