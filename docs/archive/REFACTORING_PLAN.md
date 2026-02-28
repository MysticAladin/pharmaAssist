# Angular Component Refactoring Plan

## Overview
This document outlines the plan to refactor all Angular components from inline templates/styles to separate HTML, CSS, and TypeScript files, following Angular best practices.

## Current State Analysis

### Components with Inline Templates (50+ components)
Based on the codebase scan, nearly all components currently use inline templates and styles:

#### Feature Components
- **Products**: products-list, product-form, product-detail, manufacturers, categories, low-stock
- **Orders**: orders-list, order-create, order-detail  
- **Customers**: customers-list, customer-form, customer-detail
- **Inventory**: inventory-list, transfers-list, adjustments-list
- **Prescriptions**: prescriptions-list, prescription-detail, prescription-dispense
- **Reports**: sales-report, inventory-report, financial-report, customer-report, analytics, report-builder, expiring-products-report
- **Tenders**: tenders-list, tender-form, tender-detail, tender-bid-form, my-tenders
- **Admin**: users-list, audit-logs, pricing, targets, budgets, feature-flags
- **Profile**: profile
- **Dashboard**: dashboard
- **Settings**: settings

#### Shared Components
- **Layout**: main-layout, header, sidebar, footer, notifications, loading-overlay
- **UI Components**: data-table, modal, confirm-dialog, pagination, search-input, status-badge, empty-state, loading-skeleton, notification-toast, notification-panel, notification-center, barcode-scanner, activity-feed, command-palette, help-panel, keyboard-shortcuts-help, preferences-panel, tour-overlay, virtual-scroll

## Refactoring Strategy

### Phase 1: Extract Shared Styles to SCSS Modules ✅ IN PROGRESS
Create centralized SCSS modules for common patterns:

1. **\_buttons.scss** - All button styles (primary, secondary, outline, ghost, danger, sizes)
2. **\_cards.scss** - Card layouts, stat cards, dashboard cards
3. **\_forms.scss** - Form controls, inputs, labels, validation states
4. **\_tables.scss** - Table styling, responsive tables
5. **\_filters.scss** - Filter bars, search inputs, date pickers
6. **\_layouts.scss** - Page layouts, headers, content areas
7. **\_utilities.scss** - Spacing, typography, colors utilities

### Phase 2: Create Reusable UI Components
Identify and extract common patterns:

1. **Page Header Component** - Reusable header with title, subtitle, actions
   ```html
   <app-page-header 
     [title]="'orders.title'" 
     [subtitle]="'orders.subtitle'"
     [actions]="headerActions">
   </app-page-header>
   ```

2. **Stats Card Grid Component** - Dashboard stats cards
   ```html
   <app-stats-grid [stats]="statsData"></app-stats-grid>
   ```

3. **Filter Bar Component** - Common filter patterns
   ```html
   <app-filter-bar 
     [filters]="filterConfig"
     (filtersChange)="onFilterChange($event)">
   </app-filter-bar>
   ```

4. **Action Button Group Component** - Export, New, etc.
   ```html
   <app-action-buttons 
     [buttons]="actionButtons"
     [dropdown]="exportOptions">
   </app-action-buttons>
   ```

### Phase 3: Separate Component Files
For each component, create three separate files:

**Before:**
```
product-list.component.ts (contains template, styles, and logic)
```

**After:**
```
product-list/
  ├── product-list.component.ts     (logic only)
  ├── product-list.component.html   (template)
  ├── product-list.component.scss   (minimal styles)
  └── product-list.component.spec.ts
```

### Component SCSS Guidelines
Each component SCSS should:
- Import shared modules: `@use '../../styles/buttons'`, etc.
- Only contain component-specific styles
- Maximum 50-100 lines (if more, extract to shared module)
- Use BEM naming convention for component-specific classes
- Leverage theme variables for all colors, spacing, fonts

**Example component.scss:**
```scss
@use '../../../styles/buttons';
@use '../../../styles/cards';

.product-list {
  &__header {
    // Component-specific header styles
  }
  
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-md);
  }
  
  &__item {
    // Unique item styling
  }
}
```

## Implementation Priority

### High Priority (User-Facing Features)
1. Dashboard component
2. Orders list
3. Products list
4. Customers list
5. Inventory list

### Medium Priority (Secondary Features)
6. Reports components
7. Prescriptions
8. Tenders
9. Admin panels

### Low Priority (Already Small Components)
10. Shared UI components (these are often small and acceptable as-is)

## Benefits of Refactoring

1. **Better Separation of Concerns** - Template, styles, and logic in separate files
2. **Improved Maintainability** - Easier to find and edit HTML vs TypeScript
3. **Better IDE Support** - HTML/CSS syntax highlighting and autocomplete
4. **Easier Testing** - Component logic separated from view
5. **Code Reusability** - Shared styles and components reduce duplication
6. **Performance** - Smaller component files, shared styles loaded once
7. **Team Collaboration** - Designers can work on HTML/CSS without touching TS
8. **Consistency** - Centralized styles ensure UI consistency

## Migration Steps (Per Component)

### Step 1: Extract Template
1. Create `component-name.component.html`
2. Move template content from `template: \`` to HTML file
3. Update component decorator: `templateUrl: './component-name.component.html'`

### Step 2: Extract Styles
1. Create `component-name.component.scss`
2. Move styles from `styles: [...]` to SCSS file
3. Unminify and format styles properly
4. Replace hardcoded values with theme variables
5. Extract reusable patterns to shared modules
6. Update component decorator: `styleUrls: ['./component-name.component.scss']`

### Step 3: Refactor Component Logic
1. Remove template and styles from TS file
2. Clean up and organize TypeScript code
3. Extract shared logic to services
4. Add proper type annotations

### Step 4: Create Shared Components
1. Identify repeated UI patterns
2. Create reusable components
3. Replace duplicated code with shared components

### Step 5: Test
1. Visual testing - ensure UI looks identical
2. Functional testing - ensure all interactions work
3. Responsive testing - check mobile/tablet layouts

## Shared Style Modules Structure

```
src/styles/
├── _theme.scss           (✅ exists - CSS variables)
├── _icons.scss           (✅ exists - icon definitions)
├── _buttons.scss         (🆕 create - all button styles)
├── _cards.scss           (🆕 create - card components)
├── _forms.scss           (🆕 create - form elements)
├── _tables.scss          (🆕 create - table styles)
├── _filters.scss         (🆕 create - filter bars)
├── _layouts.scss         (🆕 create - page layouts)
├── _utilities.scss       (🆕 create - helper classes)
└── _mixins.scss          (🆕 create - reusable mixins)
```

## Example: Orders List Refactoring

### Before (1200+ lines in one file)
```typescript
// orders-list.component.ts
@Component({
  template: `
    <div class="orders-page">
      <!-- 400 lines of HTML -->
    </div>
  `,
  styles: [`
    /* 600 lines of CSS */
  `]
})
export class OrdersListComponent {
  // 200 lines of TypeScript
}
```

### After (Separated, Clean)
```typescript
// orders-list.component.ts (100 lines)
@Component({
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent {
  // Clean TypeScript logic only
}
```

```html
<!-- orders-list.component.html (400 lines) -->
<app-page-header 
  [title]="'orders.title' | translate"
  [subtitle]="'orders.subtitle' | translate">
  <app-action-buttons 
    [primary]="{ label: 'New Order', action: createOrder }"
    [secondary]="exportOptions">
  </app-action-buttons>
</app-page-header>

<app-stats-grid [stats]="orderStats"></app-stats-grid>

<app-filter-bar [filters]="orderFilters"></app-filter-bar>

<app-data-table [data]="orders" [columns]="columns"></app-data-table>
```

```scss
// orders-list.component.scss (50 lines)
@use '../../../styles/layouts';
@use '../../../styles/cards';
@use '../../../styles/buttons';

.orders-page {
  @include layouts.page-container;
  
  // Only component-specific styles here
}
```

## Next Steps

1. **Create Shared Style Modules** (Week 1)
   - Create \_buttons.scss, \_cards.scss, etc.
   - Move common styles from components to modules
   
2. **Create Shared UI Components** (Week 2)
   - PageHeaderComponent
   - StatsGridComponent  
   - FilterBarComponent
   - ActionButtonsComponent

3. **Refactor High Priority Components** (Week 3-4)
   - Start with Dashboard
   - Then Orders, Products, Customers, Inventory

4. **Refactor Medium Priority Components** (Week 5-6)
   - Reports
   - Prescriptions
   - Tenders
   - Admin

5. **Review and Optimize** (Week 7)
   - Remove unused styles
   - Consolidate duplicate code
   - Performance testing
   - Documentation

## Immediate Actions

### 1. Fix Button Consistency (✅ DONE)
- Standardized btn-secondary hover effect
- Using theme variables instead of hardcoded colors
- Consistent hover states across all components

### 2. Create Button SCSS Module (NEXT)
```scss
// src/styles/_buttons.scss
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  // ... all button styles
}
```

### 3. Document Component Patterns (ONGOING)
- Identify 10 most common UI patterns
- Create design system documentation
- Build component library

## Success Metrics

- ✅ All components have separate HTML files
- ✅ Component SCSS files < 100 lines each
- ✅ At least 5 reusable shared components created
- ✅ Shared style modules handle 80% of styling
- ✅ Zero visual regressions
- ✅ Improved development velocity (easier to make changes)
- ✅ Consistent UI across entire application
