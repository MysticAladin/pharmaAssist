using Application;
using Infrastructure;
using Infrastructure.Persistence;
using Serilog;
using System.Globalization;
using Microsoft.AspNetCore.Localization;
using SharpGrip.FluentValidation.AutoValidation.Mvc.Extensions;
using Hangfire;
using Hangfire.SqlServer;
using Api.Filters;
using Infrastructure.Jobs;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File(
        path: "logs/pharmaassist-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

try
{
    Log.Information("Starting PharmaAssist API");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });
    
    // Add FluentValidation auto-validation
    builder.Services.AddFluentValidationAutoValidation();
    
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "PharmaAssist API",
            Version = "v1",
            Description = "Pharmaceutical Distribution and E-Pharmacy Portal API for Bosnia and Herzegovina",
            Contact = new()
            {
                Name = "PharmaAssist Support",
                Email = "support@pharmaassist.ba"
            }
        });
    });

    // Add Localization
    builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
    builder.Services.Configure<RequestLocalizationOptions>(options =>
    {
        var supportedCultures = new[]
        {
            new CultureInfo("en"),
            new CultureInfo("bs"), // Bosnian
            new CultureInfo("hr"), // Croatian
            new CultureInfo("sr")  // Serbian
        };

        options.DefaultRequestCulture = new RequestCulture("en");
        options.SupportedCultures = supportedCultures;
        options.SupportedUICultures = supportedCultures;
    });

    // Add CORS for Angular client
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularClient", policy =>
        {
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    // Add Hangfire
    var hangfireConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddHangfire(configuration => configuration
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseSqlServerStorage(hangfireConnectionString, new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true,
            SchemaName = "HangFire"
        }));

    // Add the processing server as IHostedService
    builder.Services.AddHangfireServer(options =>
    {
        options.WorkerCount = Environment.ProcessorCount * 2;
        options.Queues = new[] { "default", "emails", "reports" };
    });

    var app = builder.Build();

    // Seed database
    await DatabaseSeeder.SeedAsync(app.Services);

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // Use Localization
    app.UseRequestLocalization();

    app.UseHttpsRedirection();
    app.UseCors("AllowAngularClient");

    // Add request logging
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    });

    app.UseAuthentication();
    app.UseAuthorization();

    // Configure Hangfire Dashboard
    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = new[] { new HangfireAuthorizationFilter(app.Environment) },
        DashboardTitle = "PharmaAssist Jobs Dashboard",
        DisplayStorageConnectionString = false
    });

    // Register recurring jobs
    RecurringJob.AddOrUpdate<WeeklyManagerReportJob>(
        "weekly-manager-reports",
        job => job.ExecuteAsync(),
        "30 7 * * 1",  // Every Monday at 7:30 AM
        new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time") });

    RecurringJob.AddOrUpdate<DailyVisitReminderJob>(
        "daily-visit-reminders",
        job => job.ExecuteAsync(),
        "0 7 * * 1-5",  // Every weekday at 7:00 AM
        new RecurringJobOptions { TimeZone = TimeZoneInfo.FindSystemTimeZoneById("Central European Standard Time") });

    RecurringJob.AddOrUpdate<RetryFailedEmailsJob>(
        "retry-failed-emails",
        job => job.ExecuteAsync(),
        "*/15 * * * *");  // Every 15 minutes

    RecurringJob.AddOrUpdate<CleanupEmailLogsJob>(
        "cleanup-email-logs",
        job => job.ExecuteAsync(),
        "0 2 * * *");  // Every day at 2:00 AM

    app.MapControllers();

    Log.Information("PharmaAssist API started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
