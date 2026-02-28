# Testing

## Backend Testing

### Framework

| Tool | Purpose |
|------|---------|
| xUnit | Test framework |
| FluentAssertions | Assertion library |
| Moq | Mocking framework |

### Test Project

- Location: `server/tests/Application.UnitTests/`
- Project file: `Application.UnitTests.csproj`
- Targets: `net10.0`

### Existing Tests

| Test Class | Tests | What It Covers |
|-----------|-------|----------------|
| `PromotionEngineServiceTests` | ~20 tests | Promotion calculation, discount types, eligibility, stacking |
| `RepOrderServiceTests` | ~11 tests | Rep order creation, validation, customer assignment |

### Running Backend Tests

```bash
cd server
dotnet test --configuration Release --verbosity normal
```

### Test Patterns

```csharp
public class ExampleServiceTests
{
    private readonly Mock<IExampleRepository> _repositoryMock;
    private readonly ExampleService _sut;  // System Under Test

    public ExampleServiceTests()
    {
        _repositoryMock = new Mock<IExampleRepository>();
        _sut = new ExampleService(_repositoryMock.Object);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsDto()
    {
        // Arrange
        var entity = new Example { Id = Guid.NewGuid(), Name = "Test" };
        _repositoryMock.Setup(r => r.GetByIdAsync(entity.Id))
            .ReturnsAsync(entity);

        // Act
        var result = await _sut.GetByIdAsync(entity.Id);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("Test");
    }
}
```

### CI Integration

Backend tests run automatically in GitHub Actions (`deploy-full.yml`):
```yaml
- name: Run tests
  working-directory: server
  run: dotnet test --configuration Release --no-build --verbosity normal
```

---

## Frontend Testing

### Framework

| Tool | Purpose |
|------|---------|
| Vitest | Test runner (replaces Karma/Jasmine) |
| jsdom | DOM environment for tests |

### Configuration

- Config file: `client/pharma-assist/vitest.config.ts` (or in `angular.json`)
- Test files: `*.spec.ts` alongside component files

### Running Frontend Tests

```bash
cd client/pharma-assist
npx ng test           # Run via Angular CLI
npx vitest            # Run directly via Vitest
npx vitest --watch    # Watch mode
```

### Test Patterns

```typescript
import { describe, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExampleComponent } from './example.component';

describe('ExampleComponent', () => {
  let component: ExampleComponent;
  let fixture: ComponentFixture<ExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Test Coverage Areas

Current coverage is limited (~31 backend unit tests). Priority areas for expansion:
1. **Promotion engine** — Complex business logic with multiple discount types
2. **Order workflow** — Status transitions, validation rules
3. **Pricing service** — Canton-based pricing, customer tier discounts
4. **Auth service** — Token generation, validation, refresh
5. **Visit GPS validation** — Check-in/check-out coordinate verification

---

## Testing Conventions

- **Test file naming:** `*.spec.ts` (frontend), `*Tests.cs` (backend)
- **Test method naming (backend):** `MethodName_Scenario_ExpectedResult`
- **Arrange-Act-Assert** pattern for all tests
- **Mock external dependencies** — never hit real databases or APIs in unit tests
- **One assertion concept per test** — prefer multiple focused tests over one large test
- Tests must pass before merging (enforced in CI pipeline)
