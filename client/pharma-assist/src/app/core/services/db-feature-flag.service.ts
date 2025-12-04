import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map, tap, shareReplay, BehaviorSubject, switchMap, combineLatest } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  SystemFeatureFlag,
  ClientFeatureFlag,
  EvaluatedFlag,
  FlagScope,
  FlagType,
  FlagCategory,
  SystemFlagRequest,
  ClientFlagRequest,
  BulkFlagUpdateRequest,
  FlagHistoryEntry,
  FlagListResponse,
  FlagFilterOptions,
  SYSTEM_FLAGS,
  SystemFlagKey
} from '../models/feature-flag.model';
import { environment } from '../../../environments/environment';
import { AuthStateService } from '../state/auth-state.service';
import { CacheService } from './cache.service';

const CACHE_KEY = 'feature_flags';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** API Response wrapper from backend */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

/**
 * Database-backed Feature Flag Service
 * Manages feature flags at system and client levels
 * Provides flag evaluation with caching and real-time updates
 */
@Injectable({
  providedIn: 'root'
})
export class DbFeatureFlagService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private readonly cacheService = inject(CacheService);

  private readonly apiUrl = `${environment.apiUrl}/featureflags`;

  // State signals
  private readonly _systemFlags = signal<SystemFeatureFlag[]>([]);
  private readonly _clientFlags = signal<ClientFeatureFlag[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _initialized = signal(false);

  // Refresh trigger
  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // Public computed values
  readonly systemFlags = this._systemFlags.asReadonly();
  readonly clientFlags = this._clientFlags.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  // Evaluated flags for current client
  readonly evaluatedFlags = computed<Map<string, EvaluatedFlag>>(() => {
    const system = this._systemFlags();
    const client = this._clientFlags();
    const flagMap = new Map<string, EvaluatedFlag>();

    for (const sysFlag of system) {
      const clientOverride = client.find(c => c.systemFlagId === sysFlag.id || c.flagKey === sysFlag.key);

      const evaluated: EvaluatedFlag = {
        key: sysFlag.key,
        name: sysFlag.name,
        description: sysFlag.description,
        category: sysFlag.category,
        type: sysFlag.type,
        value: clientOverride && sysFlag.allowClientOverride ? clientOverride.value : sysFlag.currentValue,
        enabled: clientOverride && sysFlag.allowClientOverride ? clientOverride.enabled : sysFlag.enabled,
        source: clientOverride && sysFlag.allowClientOverride ? FlagScope.Client : FlagScope.System,
        systemValue: sysFlag.currentValue,
        clientOverride: clientOverride?.value,
        allowClientOverride: sysFlag.allowClientOverride
      };

      flagMap.set(sysFlag.key, evaluated);
    }

    return flagMap;
  });

  // Flags grouped by category
  readonly flagsByCategory = computed(() => {
    const flags = Array.from(this.evaluatedFlags().values());
    return flags.reduce((acc, flag) => {
      if (!acc[flag.category]) {
        acc[flag.category] = [];
      }
      acc[flag.category].push(flag);
      return acc;
    }, {} as Record<FlagCategory, EvaluatedFlag[]>);
  });

  constructor() {
    // Auto-refresh when user changes
    effect(() => {
      const user = this.authState.currentUser();
      if (user) {
        this.loadFlags();
      }
    });
  }

  /**
   * Initialize flags - call on app startup
   */
  initialize(): Observable<void> {
    if (this._initialized()) {
      return of(undefined);
    }

    return this.loadFlags().pipe(
      tap(() => this._initialized.set(true)),
      map(() => undefined)
    );
  }

  /**
   * Load all flags for the current client
   */
  loadFlags(): Observable<{ system: SystemFeatureFlag[], client: ClientFeatureFlag[] }> {
    this._loading.set(true);
    this._error.set(null);

    const clientId = this.getCurrentClientId();

    // Check cache first
    const cached = this.cacheService.get<{ system: SystemFeatureFlag[], client: ClientFeatureFlag[] }>(
      `${CACHE_KEY}_${clientId || 'system'}`
    );

    if (cached) {
      this._systemFlags.set(cached.system);
      this._clientFlags.set(cached.client);
      this._loading.set(false);
      return of(cached);
    }

    // Fetch from API
    const systemFlags$ = this.getSystemFlags();
    const clientFlags$ = clientId ? this.getClientFlags(clientId) : of([]);

    return combineLatest([systemFlags$, clientFlags$]).pipe(
      tap(([system, client]) => {
        // Map backend DTOs to frontend models
        const mappedSystem = system.map(s => this.mapSystemFlag(s));
        const mappedClient = client.map(c => this.mapClientFlag(c));

        this._systemFlags.set(mappedSystem);
        this._clientFlags.set(mappedClient);

        // Cache the results
        this.cacheService.set(`${CACHE_KEY}_${clientId || 'system'}`, { system: mappedSystem, client: mappedClient }, { ttl: CACHE_TTL });
      }),
      map(([system, client]) => ({ system: system.map(s => this.mapSystemFlag(s)), client: client.map(c => this.mapClientFlag(c)) })),
      catchError(error => {
        console.error('Error loading feature flags:', error);
        this._error.set('Failed to load feature flags');
        // Return default flags on error
        const defaults = this.getDefaultFlags();
        this._systemFlags.set(defaults);
        return of({ system: defaults, client: [] });
      }),
      tap(() => this._loading.set(false))
    );
  }

  /**
   * Map backend SystemFeatureFlagDto to frontend SystemFeatureFlag
   */
  private mapSystemFlag(dto: any): SystemFeatureFlag {
    return {
      id: String(dto.id),
      key: dto.key,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      type: dto.type,
      defaultValue: this.parseValue(dto.defaultValue, dto.type),
      currentValue: this.parseValue(dto.value, dto.type),
      enabled: dto.isEnabled,
      allowClientOverride: dto.allowClientOverride,
      environment: dto.environment,
      createdAt: new Date(dto.createdAt),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined
    };
  }

  /**
   * Map backend ClientFeatureFlagDto to frontend ClientFeatureFlag
   */
  private mapClientFlag(dto: any): ClientFeatureFlag {
    return {
      id: String(dto.id),
      customerId: String(dto.customerId),
      customerName: dto.customerName,
      systemFlagId: String(dto.systemFlagId),
      flagKey: dto.flagKey,
      flagName: dto.flagName,
      value: dto.value,
      enabled: dto.isEnabled,
      reason: dto.reason,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined
    };
  }

  /**
   * Parse flag value based on type
   */
  private parseValue(value: string, type: FlagType): unknown {
    switch (type) {
      case FlagType.Boolean:
        return value === 'true';
      case FlagType.Number:
      case FlagType.Percentage:
        return Number(value);
      case FlagType.Json:
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Refresh flags from server
   */
  refresh(): void {
    const clientId = this.getCurrentClientId();
    this.cacheService.delete(`${CACHE_KEY}_${clientId || 'system'}`);
    this.refreshTrigger$.next();
    this.loadFlags().subscribe();
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: SystemFlagKey | string): boolean {
    const flag = this.evaluatedFlags().get(key);
    return flag?.enabled ?? false;
  }

  /**
   * Get a flag's value
   */
  getValue<T = unknown>(key: SystemFlagKey | string): T | null {
    const flag = this.evaluatedFlags().get(key);
    return (flag?.value as T) ?? null;
  }

  /**
   * Get a flag's boolean value with default
   */
  getBooleanValue(key: SystemFlagKey | string, defaultValue = false): boolean {
    const flag = this.evaluatedFlags().get(key);
    if (!flag || !flag.enabled) return defaultValue;
    return Boolean(flag.value);
  }

  /**
   * Get a flag's string value with default
   */
  getStringValue(key: SystemFlagKey | string, defaultValue = ''): string {
    const flag = this.evaluatedFlags().get(key);
    if (!flag || !flag.enabled) return defaultValue;
    return String(flag.value);
  }

  /**
   * Get a flag's number value with default
   */
  getNumberValue(key: SystemFlagKey | string, defaultValue = 0): number {
    const flag = this.evaluatedFlags().get(key);
    if (!flag || !flag.enabled) return defaultValue;
    return Number(flag.value);
  }

  /**
   * Create a signal for a specific flag's enabled state
   */
  createFlagSignal(key: SystemFlagKey | string): ReturnType<typeof computed<boolean>> {
    return computed(() => this.isEnabled(key));
  }

  /**
   * Create a signal for a specific flag's value
   */
  createValueSignal<T = unknown>(key: SystemFlagKey | string): ReturnType<typeof computed<T | null>> {
    return computed(() => this.getValue<T>(key));
  }

  // ===========================
  // Admin API Methods
  // ===========================

  /**
   * Get all system flags (admin)
   */
  getSystemFlags(options?: FlagFilterOptions): Observable<SystemFeatureFlag[]> {
    let params = new HttpParams();

    if (options?.category) params = params.set('category', options.category);
    if (options?.enabled !== undefined) params = params.set('enabled', options.enabled.toString());
    if (options?.search) params = params.set('search', options.search);
    if (options?.page) params = params.set('page', options.page.toString());
    if (options?.pageSize) params = params.set('pageSize', options.pageSize.toString());
    if (options?.sortBy) params = params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params = params.set('sortOrder', options.sortOrder);

    return this.http.get<ApiResponse<SystemFeatureFlag[]>>(`${this.apiUrl}/system`, { params }).pipe(
      map(response => response.data || []),
      catchError(() => of(this.getDefaultFlags()))
    );
  }

  /**
   * Get paginated system flags (admin)
   */
  getSystemFlagsPaginated(options?: FlagFilterOptions): Observable<FlagListResponse<SystemFeatureFlag>> {
    let params = new HttpParams();

    if (options?.category) params = params.set('category', options.category);
    if (options?.enabled !== undefined) params = params.set('enabled', options.enabled.toString());
    if (options?.search) params = params.set('search', options.search);
    if (options?.page) params = params.set('page', options.page.toString());
    if (options?.pageSize) params = params.set('pageSize', options.pageSize.toString());
    if (options?.sortBy) params = params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params = params.set('sortOrder', options.sortOrder);

    return this.http.get<FlagListResponse<SystemFeatureFlag>>(`${this.apiUrl}/system/paginated`, { params });
  }

  /**
   * Get a single system flag by ID
   */
  getSystemFlagById(id: number): Observable<SystemFeatureFlag | null> {
    return this.http.get<ApiResponse<SystemFeatureFlag>>(`${this.apiUrl}/system/${id}`).pipe(
      map(response => response.data || null)
    );
  }

  /**
   * Get a single system flag by key
   */
  getSystemFlag(key: string): Observable<SystemFeatureFlag | null> {
    return this.http.get<ApiResponse<SystemFeatureFlag>>(`${this.apiUrl}/system/key/${key}`).pipe(
      map(response => response.data || null)
    );
  }

  /**
   * Create a new system flag (admin)
   */
  createSystemFlag(request: SystemFlagRequest): Observable<SystemFeatureFlag | null> {
    return this.http.post<ApiResponse<SystemFeatureFlag>>(`${this.apiUrl}/system`, request).pipe(
      map(response => response.data || null),
      tap(() => this.refresh())
    );
  }

  /**
   * Update a system flag (admin)
   */
  updateSystemFlag(id: number, request: Partial<SystemFlagRequest>): Observable<SystemFeatureFlag | null> {
    return this.http.put<ApiResponse<SystemFeatureFlag>>(`${this.apiUrl}/system/${id}`, request).pipe(
      map(response => response.data || null),
      tap(() => this.refresh())
    );
  }

  /**
   * Toggle a system flag's enabled state (admin)
   */
  toggleSystemFlag(id: number): Observable<boolean> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/system/${id}/toggle`, {}).pipe(
      map(response => response.data ?? false),
      tap(() => this.refresh())
    );
  }

  /**
   * Delete a system flag (admin)
   */
  deleteSystemFlag(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/system/${id}`).pipe(
      map(response => response.data ?? false),
      tap(() => this.refresh())
    );
  }

  /**
   * Get all client flags for a specific customer
   */
  getClientFlags(customerId: number | string): Observable<ClientFeatureFlag[]> {
    return this.http.get<ApiResponse<ClientFeatureFlag[]>>(`${this.apiUrl}/client/customer/${customerId}`).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get all client overrides (admin)
   */
  getAllClientOverrides(): Observable<ClientFeatureFlag[]> {
    return this.http.get<ApiResponse<ClientFeatureFlag[]>>(`${this.apiUrl}/client`).pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get all clients that have overrides for a specific flag
   */
  getClientOverridesForFlag(systemFlagId: number): Observable<ClientFeatureFlag[]> {
    return this.http.get<ApiResponse<ClientFeatureFlag[]>>(`${this.apiUrl}/client/flag/${systemFlagId}`).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Create or update a client flag override
   */
  setClientFlag(request: ClientFlagRequest): Observable<ClientFeatureFlag | null> {
    return this.http.post<ApiResponse<ClientFeatureFlag>>(`${this.apiUrl}/client`, request).pipe(
      map(response => response.data || null),
      tap(() => this.refresh())
    );
  }

  /**
   * Delete a client flag override by ID
   */
  deleteClientFlag(id: number): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/client/${id}`).pipe(
      map(response => response.data ?? false),
      tap(() => this.refresh())
    );
  }

  /**
   * Delete a client override by customer and system flag IDs
   */
  deleteClientFlagByCustomerAndFlag(customerId: number, systemFlagId: number): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/client/customer/${customerId}/flag/${systemFlagId}`).pipe(
      map(response => response.data ?? false),
      tap(() => this.refresh())
    );
  }

  /**
   * Cleanup expired client overrides (admin)
   */
  cleanupExpiredOverrides(): Observable<number> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/client/cleanup`, {}).pipe(
      map(response => response.data ?? 0)
    );
  }

  /**
   * Evaluate a single flag for optional customer
   */
  evaluateFlag(key: string, customerId?: number): Observable<EvaluatedFlag | null> {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId.toString());

    return this.http.get<ApiResponse<EvaluatedFlag>>(`${this.apiUrl}/evaluate/${key}`, { params }).pipe(
      map(response => response.data || null)
    );
  }

  /**
   * Check if a flag is enabled (API call)
   */
  isFlagEnabledApi(key: string, customerId?: number): Observable<boolean> {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId.toString());

    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/enabled/${key}`, { params }).pipe(
      map(response => response.data ?? false)
    );
  }

  /**
   * Get flag value from API
   */
  getFlagValueApi(key: string, customerId?: number): Observable<string | null> {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId.toString());

    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/value/${key}`, { params }).pipe(
      map(response => response.data || null)
    );
  }

  /**
   * Get flag history/audit log
   */
  getFlagHistory(systemFlagId?: number, take = 50): Observable<FlagHistoryEntry[]> {
    let params = new HttpParams();
    if (systemFlagId) params = params.set('systemFlagId', systemFlagId.toString());
    params = params.set('take', take.toString());

    return this.http.get<ApiResponse<FlagHistoryEntry[]>>(`${this.apiUrl}/history`, { params }).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get flag statistics
   */
  getStatistics(): Observable<{
    totalSystemFlags: number;
    enabledSystemFlags: number;
    disabledSystemFlags: number;
    totalClientOverrides: number;
    activeClientOverrides: number;
    flagsByCategory: Record<FlagCategory, number>;
  } | null> {
    return this.http.get<ApiResponse<{
      totalSystemFlags: number;
      enabledSystemFlags: number;
      disabledSystemFlags: number;
      totalClientOverrides: number;
      activeClientOverrides: number;
      flagsByCategory: Record<FlagCategory, number>;
    }>>(`${this.apiUrl}/statistics`).pipe(
      map(response => response.data || null)
    );
  }

  // ===========================
  // Private Methods
  // ===========================

  private getCurrentClientId(): number | null {
    const user = this.authState.currentUser();
    const clientId = (user as any)?.customerId || (user as any)?.clientId;
    return clientId ? Number(clientId) : null;
  }

  /**
   * Get default flags for offline/error scenarios
   */
  private getDefaultFlags(): SystemFeatureFlag[] {
    const now = new Date();

    return [
      {
        id: '1',
        key: SYSTEM_FLAGS.PORTAL_ENABLED,
        name: 'Customer Portal',
        description: 'Enable the customer-facing pharmacy portal',
        category: FlagCategory.Portal,
        type: FlagType.Boolean,
        defaultValue: true,
        currentValue: true,
        enabled: true,
        allowClientOverride: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        key: SYSTEM_FLAGS.PORTAL_SPLIT_INVOICE,
        name: 'Split Invoice',
        description: 'Allow splitting invoices for Commercial vs Essential medicines',
        category: FlagCategory.Portal,
        type: FlagType.Boolean,
        defaultValue: true,
        currentValue: true,
        enabled: true,
        allowClientOverride: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        key: SYSTEM_FLAGS.PORTAL_PRESCRIPTION_UPLOAD,
        name: 'Prescription Upload',
        description: 'Allow customers to upload prescriptions with orders',
        category: FlagCategory.Portal,
        type: FlagType.Boolean,
        defaultValue: true,
        currentValue: true,
        enabled: true,
        allowClientOverride: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '4',
        key: SYSTEM_FLAGS.BILLING_INVOICE_PDF,
        name: 'Invoice PDF Generation',
        description: 'Enable PDF generation for invoices',
        category: FlagCategory.Billing,
        type: FlagType.Boolean,
        defaultValue: true,
        currentValue: true,
        enabled: true,
        allowClientOverride: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '5',
        key: SYSTEM_FLAGS.REPORTS_PDF_EXPORT,
        name: 'PDF Export',
        description: 'Allow exporting reports to PDF format',
        category: FlagCategory.Reports,
        type: FlagType.Boolean,
        defaultValue: true,
        currentValue: true,
        enabled: true,
        allowClientOverride: false,
        createdAt: now,
        updatedAt: now
      }
    ];
  }
}
