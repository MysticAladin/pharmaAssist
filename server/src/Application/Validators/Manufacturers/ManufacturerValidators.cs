using Application.DTOs.Manufacturers;
using FluentValidation;

namespace Application.Validators.Manufacturers;

/// <summary>
/// Validator for CreateManufacturerDto
/// </summary>
public class CreateManufacturerValidator : AbstractValidator<CreateManufacturerDto>
{
    public CreateManufacturerValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Manufacturer name is required.")
            .MaximumLength(200).WithMessage("Manufacturer name cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Country)
            .NotEmpty().WithMessage("Country is required.")
            .MaximumLength(100).WithMessage("Country cannot exceed 100 characters.");

        RuleFor(x => x.LogoUrl)
            .MaximumLength(500).WithMessage("Logo URL cannot exceed 500 characters.")
            .Must(BeAValidUrl).WithMessage("Invalid logo URL format.")
            .When(x => !string.IsNullOrEmpty(x.LogoUrl));

        RuleFor(x => x.Website)
            .MaximumLength(255).WithMessage("Website URL cannot exceed 255 characters.")
            .Must(BeAValidUrl).WithMessage("Invalid website URL format.")
            .When(x => !string.IsNullOrEmpty(x.Website));

        RuleFor(x => x.ContactEmail)
            .EmailAddress().WithMessage("Invalid email address format.")
            .MaximumLength(255).WithMessage("Email cannot exceed 255 characters.")
            .When(x => !string.IsNullOrEmpty(x.ContactEmail));

        RuleFor(x => x.ContactPhone)
            .MaximumLength(50).WithMessage("Phone number cannot exceed 50 characters.")
            .Matches(@"^\+?[0-9\s\-\(\)]+$").WithMessage("Invalid phone number format.")
            .When(x => !string.IsNullOrEmpty(x.ContactPhone));
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
               && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}

/// <summary>
/// Validator for UpdateManufacturerDto
/// </summary>
public class UpdateManufacturerValidator : AbstractValidator<UpdateManufacturerDto>
{
    public UpdateManufacturerValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Manufacturer name is required.")
            .MaximumLength(200).WithMessage("Manufacturer name cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Country)
            .NotEmpty().WithMessage("Country is required.")
            .MaximumLength(100).WithMessage("Country cannot exceed 100 characters.");

        RuleFor(x => x.LogoUrl)
            .MaximumLength(500).WithMessage("Logo URL cannot exceed 500 characters.")
            .Must(BeAValidUrl).WithMessage("Invalid logo URL format.")
            .When(x => !string.IsNullOrEmpty(x.LogoUrl));

        RuleFor(x => x.Website)
            .MaximumLength(255).WithMessage("Website URL cannot exceed 255 characters.")
            .Must(BeAValidUrl).WithMessage("Invalid website URL format.")
            .When(x => !string.IsNullOrEmpty(x.Website));

        RuleFor(x => x.ContactEmail)
            .EmailAddress().WithMessage("Invalid email address format.")
            .MaximumLength(255).WithMessage("Email cannot exceed 255 characters.")
            .When(x => !string.IsNullOrEmpty(x.ContactEmail));

        RuleFor(x => x.ContactPhone)
            .MaximumLength(50).WithMessage("Phone number cannot exceed 50 characters.")
            .Matches(@"^\+?[0-9\s\-\(\)]+$").WithMessage("Invalid phone number format.")
            .When(x => !string.IsNullOrEmpty(x.ContactPhone));
    }

    private bool BeAValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
               && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}
