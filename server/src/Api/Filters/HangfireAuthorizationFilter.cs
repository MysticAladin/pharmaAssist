using Hangfire.Dashboard;

namespace Api.Filters;

/// <summary>
/// Authorization filter for Hangfire Dashboard
/// In development: allows all access
/// In production: requires Admin role
/// </summary>
public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
{
    private readonly IWebHostEnvironment _environment;

    public HangfireAuthorizationFilter(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public bool Authorize(DashboardContext context)
    {
        // In development, allow all access
        if (_environment.IsDevelopment())
        {
            return true;
        }

        // In production, require authentication and Admin role
        var httpContext = context.GetHttpContext();
        
        if (!httpContext.User.Identity?.IsAuthenticated ?? true)
        {
            return false;
        }

        // Only allow Admin users to access the dashboard
        return httpContext.User.IsInRole("Admin");
    }
}
