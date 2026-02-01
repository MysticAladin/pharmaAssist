# PharmaAssist Angular Frontend - Coding Guidelines

This document establishes the patterns and conventions used in this codebase. All new pages and components must follow these guidelines to ensure consistency.

---

## Table of Contents

1. [Page Structure](#1-page-structure)
2. [SCSS Module System](#2-scss-module-system)
3. [Page Header Pattern](#3-page-header-pattern)
4. [Filters Section Pattern](#4-filters-section-pattern)
5. [Date Formatting](#5-date-formatting)
6. [Stats Cards Pattern](#6-stats-cards-pattern)
7. [Buttons](#7-buttons)
8. [Data Tables](#8-data-tables)
9. [Empty States](#9-empty-states)
10. [Translation Keys](#10-translation-keys)
11. [File Structure](#11-file-structure)
12. [Reference Examples](#12-reference-examples)

---

## 1. Page Structure

Every list/dashboard page follows this exact structure:

```html
<div class="[feature]-page">
  <!-- 1. Page Header -->
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">{{ 'feature.title' | translate }}</h1>
      <p class="page-subtitle">{{ 'feature.subtitle' | translate }}</p>
    </div>
    <div class="header-actions">
      <!-- Secondary buttons first, primary last -->
      <button class="btn btn-secondary">Export</button>
      <button class="btn btn-primary">+ Add New</button>
    </div>
  </div>

  <!-- 2. Stats Cards (optional) -->
  <div class="stats-grid">
    <!-- Stats cards here -->
  </div>

  <!-- 3. Filters Section -->
  <div class="filters-section">
    <app-search-input [placeholder]="..." (search)="..."></app-search-input>
    <div class="filter-group">
      <!-- Filter controls -->
    </div>
  </div>

  <!-- 4. Content (table, cards, list) -->
  @if (loading()) {
    <div class="loading-state">...</div>
  } @else if (items().length === 0) {
    <app-empty-state ...></app-empty-state>
  } @else {
    <!-- Main content -->
  }
</div>
```

### SCSS for Page Container

```scss
// Import shared modules at the top
@use '../../../../styles/buttons';
@use '../../../../styles/cards';
@use '../../../../styles/layouts';
@use '../../../../styles/filters';

.feature-page {
  @include layouts.page-container;  // padding: 1.5rem, max-width: 1400px, margin: 0 auto
}
```

---

## 2. SCSS Module System

We use shared SCSS modules located in `src/styles/`. **ALWAYS** import these instead of writing custom styles:

| Module | Purpose | Key Classes/Mixins |
|--------|---------|-------------------|
| `_layouts.scss` | Page containers, headers | `page-container`, `.page-header`, `.page-title`, `.page-subtitle` |
| `_buttons.scss` | All button styles | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon` |
| `_filters.scss` | Filter bars and inputs | `.filters-section`, `.filter-group`, `.filter-select`, `.filter-checkbox` |
| `_cards.scss` | Stat cards, dashboard cards | `.stat-card`, `@include cards.stats-grid(4)` |
| `_table-actions.scss` | Table action buttons | `.actions`, `.btn-icon` |

### Import Pattern

```scss
// At the top of component SCSS file
@use '../../../../styles/buttons';
@use '../../../../styles/cards';
@use '../../../../styles/layouts';
@use '../../../../styles/filters';
```

Path depth depends on component location. Count directories from component to `src/styles/`.

---

## 3. Page Header Pattern

### Standard Header Structure (from layouts.scss)

```html
<div class="page-header">
  <div class="header-content">
    <h1 class="page-title">{{ 'feature.title' | translate }}</h1>
    <p class="page-subtitle">{{ 'feature.subtitle' | translate }}</p>
  </div>
  <div class="header-actions">
    <button class="btn btn-secondary" (click)="export()">
      <svg><!-- download icon --></svg>
      {{ 'common.export' | translate }}
    </button>
    <button class="btn btn-primary" (click)="add()">
      <svg><!-- plus icon --></svg>
      {{ 'feature.add' | translate }}
    </button>
  </div>
</div>
```

### Key CSS (already in _layouts.scss - do NOT duplicate)

```scss
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-content { flex: 1; min-width: 0; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}
```

### ❌ DO NOT use PageHeaderComponent for list pages

The `PageHeaderComponent` is for simple pages. For feature list pages (products, orders, customers, visits), use the inline HTML structure above to have full control over header actions and styling.

---

## 4. Filters Section Pattern

### Standard Filter Bar Structure

```html
<div class="filters-section">
  <!-- Search input (always first) -->
  <app-search-input
    [placeholder]="'feature.searchPlaceholder' | translate"
    (search)="onSearch($event)"
  ></app-search-input>

  <!-- Filter controls -->
  <div class="filter-group">
    <!-- Dropdowns -->
    <select class="filter-select" [(ngModel)]="selectedStatus" (change)="applyFilters()">
      <option value="">{{ 'feature.allStatuses' | translate }}</option>
      @for (status of statusOptions; track status.value) {
        <option [value]="status.value">{{ status.label | translate }}</option>
      }
    </select>

    <!-- Checkboxes -->
    <label class="filter-checkbox">
      <input type="checkbox" [(ngModel)]="activeOnly" (change)="applyFilters()">
      <span>{{ 'feature.activeOnly' | translate }}</span>
    </label>

    <!-- Date Filters (see Date section) -->
    <div class="date-input-wrapper">...</div>

    <!-- Clear Filters Button (conditional) -->
    @if (hasActiveFilters()) {
      <button class="btn btn-ghost" (click)="clearFilters()">
        <svg><!-- X icon --></svg>
        {{ 'common.clearFilters' | translate }}
      </button>
    }
  </div>
</div>
```

### Filter styles are in _filters.scss - just import and use classes

---

## 5. Date Formatting

### Display Format: `dd.MM.yyyy` (European)

**ALWAYS use the `EuropeanDatePipe` for displaying dates:**

```typescript
// Import in component
import { EuropeanDatePipe } from '../../core/pipes';

// Add to imports array
imports: [EuropeanDatePipe]
```

```html
<!-- Date only: 31.01.2026 -->
{{ order.orderDate | europeanDate }}

<!-- Date with time: 31.01.2026 14:30 -->
{{ visit.checkInTime | europeanDate:'datetime' }}
```

### Date Input Pattern (from Orders List)

For date filter inputs, use this exact pattern:

```html
<div class="date-input-wrapper">
  <!-- Visible text input with European format -->
  <input
    type="text"
    [(ngModel)]="fromDate"
    (ngModelChange)="onDateFilterChange()"
    placeholder="dd.MM.yyyy"
    class="filter-select date-filter"
  />
  <!-- Hidden native date picker -->
  <input
    type="date"
    class="hidden-date-picker"
    (change)="onNativeFromDateChange($event)"
    #fromDatePicker
  />
  <!-- Calendar button -->
  <button type="button" class="calendar-icon" (click)="fromDatePicker.showPicker()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  </button>
</div>
```

### Required SCSS for Date Input Wrapper

```scss
.date-input-wrapper {
  position: relative;
  min-width: 150px;

  .hidden-date-picker {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;
  }

  .calendar-icon {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--neutral-500);
    transition: color var(--transition-fast);

    &:hover {
      color: var(--brand-primary);
    }
  }

  .filter-select.date-filter {
    padding-right: 2.5rem;
  }
}
```

### ❌ NEVER use `type="date"` input directly

Native date inputs display differently across browsers. Always use the text input with date picker pattern shown above.

### ❌ NEVER use `toLocaleDateString()` or `toLocaleTimeString()`

These produce inconsistent results. Always use `EuropeanDatePipe`.

---

## 6. Stats Cards Pattern

### Stats Grid Structure

```html
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-icon pending">
      <svg><!-- icon --></svg>
    </div>
    <div class="stat-content">
      <span class="stat-value">{{ count() }}</span>
      <span class="stat-label">{{ 'feature.stats.pending' | translate }}</span>
    </div>
  </div>
  <!-- Repeat for other stats -->
</div>
```

### SCSS

```scss
.stats-grid {
  @include cards.stats-grid(4);  // 4 columns
  margin-bottom: 1.5rem;
}

.stat-card {
  @include cards.stat-card;
}

.stat-icon {
  @include cards.stat-icon;
  
  &.pending { background: #fff7ed; color: #ea580c; }
  &.processing { background: #eff6ff; color: #2563eb; }
  &.completed { background: #ecfdf5; color: #059669; }
  // etc.
}
```

---

## 7. Buttons

### Button Classes (from _buttons.scss)

| Class | Use Case |
|-------|----------|
| `.btn` | Base button (rarely used alone) |
| `.btn-primary` | Primary actions (Create, Save, Confirm) |
| `.btn-secondary` | Secondary actions (Export, Edit) |
| `.btn-ghost` | Tertiary actions (Clear Filters, Cancel) |
| `.btn-outline` | Outlined style |
| `.btn-danger` | Destructive actions (Delete) |
| `.btn-icon` | Icon-only buttons (in tables) |

### Button with Icon Pattern

```html
<button class="btn btn-primary" (click)="create()">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 5v14M5 12h14"/>
  </svg>
  {{ 'feature.addNew' | translate }}
</button>
```

### Button Order in Header

Secondary buttons first, primary button last:

```html
<div class="header-actions">
  <button class="btn btn-secondary">Export</button>  <!-- first -->
  <button class="btn btn-primary">+ Create</button>  <!-- last -->
</div>
```

---

## 8. Data Tables

Use `DataTableComponent` for all tables:

```typescript
imports: [DataTableComponent]
```

```html
<app-data-table
  [data]="items()"
  [columns]="columns"
  [loading]="loading()"
  [clickable]="true"
  (rowClick)="onRowClick($event)"
  (sortChange)="onSort($event)"
></app-data-table>
```

---

## 9. Empty States

Use `EmptyStateComponent`:

```html
<app-empty-state
  icon="package"
  [title]="'feature.empty.title' | translate"
  [description]="'feature.empty.description' | translate"
  [actionLabel]="'feature.add' | translate"
  (actionClick)="create()"
></app-empty-state>
```

---

## 10. Translation Keys

### Structure

```json
{
  "feature": {
    "title": "Feature Title",
    "subtitle": "Manage your features",
    "searchPlaceholder": "Search features...",
    "add": "Add Feature",
    "stats": {
      "total": "Total",
      "active": "Active"
    },
    "empty": {
      "title": "No features yet",
      "description": "Get started by adding your first feature"
    }
  }
}
```

### Always add to BOTH en.json and bs.json

---

## 11. File Structure

### List Page Component

```
features/
  feature-name/
    feature-list-component/
      feature-list.component.html
      feature-list.component.scss
    feature-list.component.ts  (or in -component folder if large)
```

### For inline template components:

```typescript
@Component({
  selector: 'app-feature-list',
  standalone: true,
  imports: [...],
  templateUrl: './feature-list-component/feature-list.component.html',
  styleUrls: ['./feature-list-component/feature-list.component.scss']
})
```

---

## 12. Reference Examples

When creating new pages, reference these files:

| Pattern | Reference File |
|---------|---------------|
| **List Page** | `features/products/products-list-component/products-list.component.html` |
| **Page SCSS** | `features/products/products-list-component/products-list.component.scss` |
| **Filters** | `features/orders/orders-list/orders-list.component.html` (lines 195-250) |
| **Date Inputs** | `features/orders/orders-list/orders-list.component.html` (date-input-wrapper) |
| **Stats Cards** | `features/customers/customers-list-component/customers-list.component.html` |
| **European Date** | `core/pipes/european-date.pipe.ts` |

---

## Quick Checklist for New Pages

- [ ] SCSS imports shared modules (`layouts`, `buttons`, `filters`, `cards`)
- [ ] Page container uses `@include layouts.page-container`
- [ ] Header uses `.page-header`, `.header-content`, `.header-actions` pattern
- [ ] All dates use `europeanDate` pipe
- [ ] Date inputs use text input + hidden date picker + calendar icon pattern
- [ ] Filters in `.filters-section` with `.filter-group`
- [ ] Buttons follow order: secondary → primary
- [ ] Translations added to both `en.json` and `bs.json`
- [ ] Empty states use `EmptyStateComponent`
- [ ] Loading states handled
