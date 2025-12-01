import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  IUser,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
  ILoginResponse
} from '../models/user.model';

const STORAGE_KEYS = {
  TOKEN: 'pa_token',
  REFRESH_TOKEN: 'pa_refresh_token',
  USER: 'pa_user',
  REMEMBER_ME: 'pa_remember_me'
};

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  // BehaviorSubjects for reactive state
  private readonly _user$ = new BehaviorSubject<IUser | null>(null);
  private readonly _token$ = new BehaviorSubject<string | null>(null);
  private readonly _isLoading$ = new BehaviorSubject<boolean>(false);
  private readonly _isInitialized$ = new BehaviorSubject<boolean>(false);

  // Signals for template reactivity (Angular 21)
  readonly user = signal<IUser | null>(null);
  readonly currentUser = this.user; // Alias for compatibility
  readonly isAuthenticated = computed(() => !!this.user());
  readonly userRoles = computed(() => this.user()?.roles ?? []);
  readonly userPermissions = computed(() => this.user()?.permissions ?? []);

  // Observables for components
  readonly user$: Observable<IUser | null> = this._user$.asObservable();
  readonly token$: Observable<string | null> = this._token$.asObservable();
  readonly isLoading$: Observable<boolean> = this._isLoading$.asObservable();
  readonly isInitialized$: Observable<boolean> = this._isInitialized$.asObservable();

  constructor() {
    this.initializeFromStorage();
  }

  /**
   * Initialize auth state from storage on app start
   */
  initializeFromStorage(): void {
    const storage = this.getStorage();
    const token = storage.getItem(STORAGE_KEYS.TOKEN);
    const userJson = storage.getItem(STORAGE_KEYS.USER);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as IUser;
        this.setAuthState(user, token);
      } catch {
        this.clearAuthState();
      }
    }

    this._isInitialized$.next(true);
  }

  /**
   * Get appropriate storage based on remember me preference
   */
  private getStorage(): Storage {
    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    return rememberMe ? localStorage : sessionStorage;
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this._isLoading$.next(loading);
  }

  /**
   * Login - set authentication state from login response
   */
  login(response: ILoginResponse, rememberMe = false): void {
    if (response.succeeded && response.user && response.accessToken) {
      this.setAuthState(response.user, response.accessToken, response.refreshToken, rememberMe);
    }
  }

  /**
   * Logout - clear authentication state
   */
  logout(): void {
    this.clearAuthState();
  }

  /**
   * Set authentication state after login
   */
  setAuthState(user: IUser, token: string, refreshToken?: string, rememberMe = false): void {
    // Determine storage
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    }
    const storage = rememberMe ? localStorage : sessionStorage;

    // Store in storage
    storage.setItem(STORAGE_KEYS.TOKEN, token);
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    if (refreshToken) {
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    // Update state
    this._user$.next(user);
    this._token$.next(token);
    this.user.set(user);
  }

  /**
   * Update user data
   */
  updateUser(user: IUser): void {
    const storage = this.getStorage();
    storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    this._user$.next(user);
    this.user.set(user);
  }

  /**
   * Update token (for refresh)
   */
  updateToken(token: string, refreshToken?: string): void {
    const storage = this.getStorage();
    storage.setItem(STORAGE_KEYS.TOKEN, token);
    if (refreshToken) {
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    this._token$.next(token);
  }

  /**
   * Clear auth state on logout
   */
  clearAuthState(): void {
    // Clear both storages
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);

    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);

    // Update state
    this._user$.next(null);
    this._token$.next(null);
    this.user.set(null);
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this._token$.getValue() ?? this.getStorage().getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return this.getStorage().getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get current user
   */
  getUser(): IUser | null {
    return this._user$.getValue();
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole | string): boolean {
    const currentUser = this.getUser();
    return currentUser?.roles?.includes(role) ?? false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: (UserRole | string)[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roles: (UserRole | string)[]): boolean {
    return roles.every(role => this.hasRole(role));
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: Permission | string): boolean {
    const currentUser = this.getUser();

    // Check direct permissions
    if (currentUser?.permissions?.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    if (currentUser?.roles) {
      for (const role of currentUser.roles) {
        const rolePermissions = ROLE_PERMISSIONS[role as UserRole];
        if (rolePermissions?.includes(permission as Permission)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: (Permission | string)[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions: (Permission | string)[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user is admin (SuperAdmin or Admin)
   */
  isAdmin(): boolean {
    return this.hasAnyRole([UserRole.SuperAdmin, UserRole.Admin]);
  }

  /**
   * Check if user is SuperAdmin
   */
  isSuperAdmin(): boolean {
    return this.hasRole(UserRole.SuperAdmin);
  }

  /**
   * Check if user is internal (not a customer)
   */
  isInternalUser(): boolean {
    return this.hasAnyRole([
      UserRole.SuperAdmin,
      UserRole.Admin,
      UserRole.Manager,
      UserRole.Pharmacist,
      UserRole.SalesRep,
      UserRole.Warehouse
    ]);
  }

  /**
   * Check if user is a customer
   */
  isCustomer(): boolean {
    return this.hasRole(UserRole.Customer) && !this.isInternalUser();
  }
}
