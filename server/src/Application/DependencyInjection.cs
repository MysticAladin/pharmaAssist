using Application.Interfaces;
using Application.Mappings;
using Application.Services;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;
        
        // Add AutoMapper with profiles from assembly
        services.AddAutoMapper(cfg => cfg.AddMaps(assembly));
        
        // Add FluentValidation
        services.AddValidatorsFromAssembly(assembly);
        
        // Register Application Services
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IManufacturerService, ManufacturerService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ILocationService, LocationService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IFeatureFlagService, FeatureFlagService>();
        services.AddScoped<INotificationSettingsService, NotificationSettingsService>();
        
        return services;
    }
}
