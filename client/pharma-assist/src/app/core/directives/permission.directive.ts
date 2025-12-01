import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit, OnDestroy, effect } from '@angular/core';
import { AuthStateService } from '../state/auth-state.service';
import { Permission, UserRole } from '../models/user.model';

/**
 * Structural directive to conditionally show content based on user permission
 *
 * Usage:
 * <div *hasPermission="'products.create'">
 *   <button>Create Product</button>
 * </div>
 *
 * With else template:
 * <div *hasPermission="'products.delete'; else noAccess">
 *   <button>Delete</button>
 * </div>
 * <ng-template #noAccess>
 *   <span>No permission to delete</span>
 * </ng-template>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authState = inject(AuthStateService);

  private permission: Permission | Permission[] | null = null;
  private elseTemplateRef: TemplateRef<unknown> | null = null;
  private requireAll = false;
  private hasView = false;

  @Input()
  set hasPermission(permission: Permission | Permission[]) {
    this.permission = permission;
    this.updateView();
  }

  @Input()
  set hasPermissionElse(templateRef: TemplateRef<unknown>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  @Input()
  set hasPermissionAll(requireAll: boolean) {
    this.requireAll = requireAll;
    this.updateView();
  }

  constructor() {
    // React to auth state changes
    effect(() => {
      // Access signals to trigger effect
      this.authState.currentUser();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasAccess = this.checkAccess();

    if (hasAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess && this.hasView) {
      this.viewContainer.clear();
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
      this.hasView = false;
    } else if (!hasAccess && !this.hasView && this.elseTemplateRef) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.elseTemplateRef);
    }
  }

  private checkAccess(): boolean {
    if (!this.permission) return false;

    if (Array.isArray(this.permission)) {
      return this.requireAll
        ? this.authState.hasAllPermissions(this.permission)
        : this.authState.hasAnyPermission(this.permission);
    }

    return this.authState.hasPermission(this.permission);
  }
}

/**
 * Structural directive to conditionally show content based on user role
 *
 * Usage:
 * <div *hasRole="'Admin'">
 *   Admin only content
 * </div>
 *
 * Multiple roles:
 * <div *hasRole="['Admin', 'Manager']">
 *   Admin or Manager content
 * </div>
 */
@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authState = inject(AuthStateService);

  private role: UserRole | UserRole[] | null = null;
  private elseTemplateRef: TemplateRef<unknown> | null = null;
  private hasView = false;

  @Input()
  set hasRole(role: UserRole | UserRole[]) {
    this.role = role;
    this.updateView();
  }

  @Input()
  set hasRoleElse(templateRef: TemplateRef<unknown>) {
    this.elseTemplateRef = templateRef;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authState.currentUser();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasAccess = this.checkAccess();

    if (hasAccess && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAccess) {
      this.viewContainer.clear();
      if (this.elseTemplateRef) {
        this.viewContainer.createEmbeddedView(this.elseTemplateRef);
      }
      this.hasView = false;
    }
  }

  private checkAccess(): boolean {
    if (!this.role) return false;

    if (Array.isArray(this.role)) {
      return this.authState.hasAnyRole(this.role);
    }

    return this.authState.hasRole(this.role);
  }
}

/**
 * Structural directive to show content only when authenticated
 *
 * Usage:
 * <div *isAuthenticated>
 *   Welcome, user!
 * </div>
 * <div *isAuthenticated="false">
 *   Please log in
 * </div>
 */
@Directive({
  selector: '[isAuthenticated]',
  standalone: true
})
export class IsAuthenticatedDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authState = inject(AuthStateService);

  private shouldBeAuthenticated = true;
  private hasView = false;

  @Input()
  set isAuthenticated(value: boolean | '') {
    // Handle both *isAuthenticated and *isAuthenticated="true/false"
    this.shouldBeAuthenticated = value === '' || value === true;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authState.isAuthenticated();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const isAuth = this.authState.isAuthenticated();
    const shouldShow = this.shouldBeAuthenticated ? isAuth : !isAuth;

    if (shouldShow && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!shouldShow && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

/**
 * Structural directive to hide content from specific roles
 *
 * Usage:
 * <div *hideFromRole="'Customer'">
 *   Hidden from customers
 * </div>
 */
@Directive({
  selector: '[hideFromRole]',
  standalone: true
})
export class HideFromRoleDirective implements OnInit {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authState = inject(AuthStateService);

  private role: UserRole | UserRole[] | null = null;
  private hasView = false;

  @Input()
  set hideFromRole(role: UserRole | UserRole[]) {
    this.role = role;
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authState.currentUser();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const shouldHide = this.checkShouldHide();

    if (!shouldHide && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (shouldHide && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private checkShouldHide(): boolean {
    if (!this.role) return false;

    if (Array.isArray(this.role)) {
      return this.authState.hasAnyRole(this.role);
    }

    return this.authState.hasRole(this.role);
  }
}
