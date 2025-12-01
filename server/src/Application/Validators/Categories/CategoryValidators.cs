using Application.DTOs.Categories;
using FluentValidation;

namespace Application.Validators.Categories;

/// <summary>
/// Validator for CreateCategoryDto
/// </summary>
public class CreateCategoryValidator : AbstractValidator<CreateCategoryDto>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100).WithMessage("Category name cannot exceed 100 characters.");

        RuleFor(x => x.NameLocal)
            .MaximumLength(100).WithMessage("Local name cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.NameLocal));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.ParentCategoryId)
            .GreaterThan(0).WithMessage("Parent category ID must be a positive number.")
            .When(x => x.ParentCategoryId.HasValue);

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order cannot be negative.");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));
    }
}

/// <summary>
/// Validator for UpdateCategoryDto
/// </summary>
public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryDto>
{
    public UpdateCategoryValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(100).WithMessage("Category name cannot exceed 100 characters.");

        RuleFor(x => x.NameLocal)
            .MaximumLength(100).WithMessage("Local name cannot exceed 100 characters.")
            .When(x => !string.IsNullOrEmpty(x.NameLocal));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.ParentCategoryId)
            .GreaterThan(0).WithMessage("Parent category ID must be a positive number.")
            .When(x => x.ParentCategoryId.HasValue);

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Display order cannot be negative.");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL cannot exceed 500 characters.")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));
    }
}
