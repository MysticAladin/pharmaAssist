# Coding Standards

## General Principles

- Follow Clean Architecture separation: Domain has no dependencies, Application depends on Domain, Infrastructure implements Application interfaces, Api depends on all layers
- All text visible to users must use translation keys (ngx-translate) — never hardcode display strings
- Dates displayed to users must use European format (`dd.MM.yyyy`) via `EuropeanDatePipe`
- Currency must use KM format (`1.234,56 KM`) via `KmCurrencyPipe`
- All translation keys must be added to both `en.json` (English) and `bs.json` (Bosnian)

---

## Backend (.NET / C#)

### Project Structure

```
Domain/           → Entities, Enums, Repository interfaces (zero dependencies)
Application/      → Service interfaces, DTOs, Validators, Mappings (depends on Domain)
Infrastructure/   → EF Core, Repositories, Services, Jobs (implements Application)
Api/              → Controllers, middleware, DI config (presentation layer)
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `OrderService`, `ProductDto` |
| Interfaces | I-prefix PascalCase | `IOrderService`, `IProductRepository` |
| Methods | PascalCase | `GetOrderByIdAsync()` |
| Properties | PascalCase | `OrderDate`, `TotalAmount` |
| Local variables | camelCase | `orderItems`, `totalCount` |
| Constants | PascalCase | `MaxRetryCount` |
| Private fields | _camelCase | `_orderService`, `_logger` |
| Async methods | Async suffix | `GetAllAsync()`, `CreateOrderAsync()` |

### Controller Conventions

- Route prefix: `[Route("api/[controller]")]`
- Use `[ApiController]` attribute for auto model validation
- Return `ActionResult<T>` for typed responses
- Use `[Authorize]` with roles or `[HasPermission]` for authorization
- HTTP verbs: `[HttpGet]`, `[HttpPost]`, `[HttpPut]`, `[HttpDelete]`
- Inject services via constructor DI

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExampleController : ControllerBase
{
    private readonly IExampleService _exampleService;

    public ExampleController(IExampleService exampleService)
    {
        _exampleService = exampleService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<ExampleDto>>> GetAll(
        [FromQuery] ExampleFilter filter)
    {
        var result = await _exampleService.GetAllAsync(filter);
        return Ok(result);
    }
}
```

### Service Implementation

- Define interface in `Application/Interfaces/`
- Implement in `Infrastructure/Services/`
- Register in `DependencyInjection.cs` using `builder.Services.AddScoped<IService, Service>()`
- Use async/await for all I/O operations
- Log significant operations via `ILogger<T>`

### DTO Conventions

- Separate DTOs for Create, Update, and Response
- Use records for immutable DTOs when appropriate
- Name pattern: `{Entity}Dto`, `Create{Entity}Dto`, `Update{Entity}Dto`
- Place in `Application/DTOs/{Feature}/`

### Validation

- Use FluentValidation for all request validation
- Create validators in `Application/Validators/`
- Auto-validation is enabled via SharpGrip (no manual `ModelState` checks needed)

### Entity Framework

- Use Code-First migrations
- Configure entities via `IEntityTypeConfiguration<T>` in `Infrastructure/Data/Configurations/`
- Add migrations: `dotnet ef migrations add MigrationName --project src/Infrastructure --startup-project src/Api`
- Seed data in `ApplicationDbContext.SeedDataAsync()` (called on startup)

---

## Frontend (Angular / TypeScript)

### Component Architecture

- **Standalone components only** — never use NgModules
- **Signals** for reactive state (`signal()`, `computed()`, `effect()`)
- Prefer `templateUrl` and `styleUrls` over inline templates/styles (refactoring in progress)
- Each component gets its own folder with `.ts`, `.html`, `.scss` files

### File Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Components | kebab-case | `order-detail.component.ts` |
| Services | kebab-case | `order.service.ts` |
| Models | kebab-case | `order.model.ts` |
| Guards | kebab-case | `auth.guard.ts` |
| Pipes | kebab-case | `european-date.pipe.ts` |
| Features | kebab-case folder | `features/orders/` |

### Component Naming

```typescript
@Component({
  selector: 'app-feature-name',    // always app- prefix
  standalone: true,
  imports: [...],
  templateUrl: './feature-name.component.html',
  styleUrls: ['./feature-name.component.scss']
})
export class FeatureNameComponent { }
```

### Page Structure Pattern

Every list/dashboard page follows this structure:

```html
<div class="feature-page">
  <!-- 1. Page Header -->
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">{{ 'feature.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'feature.subtitle' | translate }}</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary">Export</button>
      <button class="btn btn-primary">+ Add New</button>
    </div>
  </div>

  <!-- 2. Stats Cards (optional) -->
  <div class="stats-grid">...</div>

  <!-- 3. Filters Section -->
  <div class="filters-section">
    <app-search-input ...></app-search-input>
    <div class="filter-group">...</div>
  </div>

  <!-- 4. Content -->
  @if (loading()) { ... }
  @else if (items().length === 0) { <app-empty-state .../> }
  @else { <!-- main content --> }
</div>
```

### SCSS Conventions

- Always import shared SCSS modules at the top of component `.scss` files:
  ```scss
  @use '../../../../styles/buttons';
  @use '../../../../styles/cards';
  @use '../../../../styles/layouts';
  @use '../../../../styles/filters';
  ```
- Use `@include layouts.page-container` for page containers
- Use CSS custom properties from `_theme.scss` for all colors, spacing, fonts
- Maximum 50-100 lines per component SCSS (extract to shared modules if more)
- Use BEM naming for component-specific classes

### Button Order

In header actions: secondary buttons first, primary button last.

### Date Handling

- **Display:** Always use `EuropeanDatePipe`: `{{ date | europeanDate }}` or `{{ date | europeanDate:'datetime' }}`
- **Input:** Use text input + hidden date picker + calendar icon pattern (never raw `type="date"`)
- **Never** use `toLocaleDateString()` or `toLocaleTimeString()`

### Conditional Rendering

Use Angular's new control flow syntax:
```html
@if (condition) { ... }
@else if (other) { ... }
@else { ... }
@for (item of items(); track item.id) { ... }
@empty { ... }
```

### Services

- Place in `core/services/`
- Use `@Injectable({ providedIn: 'root' })` for singleton services
- Use `HttpClient` for API calls
- Return `Observable<T>` from service methods
- API base URL from environment configuration

### Models

- Place in `core/models/`
- Use TypeScript interfaces (not classes) for data models
- Match backend DTO structure

---

## Git & Version Control

- Branch naming: `feature/description`, `fix/description`, `refactor/description`
- Commit messages: Descriptive and imperative ("Add order export", "Fix pagination bug")
- PR process: Build must pass, tests must pass

---

## Reference Files

When creating new features, use these as reference implementations:

| Pattern | Reference |
|---------|-----------|
| List page HTML | `features/products/products-list-component/products-list.component.html` |
| List page SCSS | `features/products/products-list-component/products-list.component.scss` |
| Filter bar | `features/orders/orders-list/orders-list.component.html` |
| Stats cards | `features/customers/customers-list-component/customers-list.component.html` |
| Controller | Any controller in `server/src/Api/Controllers/` |
| Service interface | Any interface in `server/src/Application/Interfaces/` |
