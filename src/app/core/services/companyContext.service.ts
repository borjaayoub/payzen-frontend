import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  CompanyMembership, 
  AppContext, 
  CONTEXT_STORAGE_KEYS 
} from '@app/core/models/membership.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyContextService {
  // Use inject() to avoid circular dependency issues
  private readonly router = inject(Router);
  
  // ============================================
  // SIGNALS - Reactive State Management
  // ============================================
  
  /** Current selected context (company + role) */
  private readonly _currentContext = signal<AppContext | null>(this.loadStoredContext());
  
  /** All available memberships for the logged-in user */
  private readonly _memberships = signal<CompanyMembership[]>(this.loadStoredMemberships());
  
  /** Loading state for context operations */
  private readonly _isLoading = signal<boolean>(false);

  // ============================================
  // PUBLIC COMPUTED SIGNALS
  // ============================================
  
  /** Read-only access to current context */
  readonly currentContext = this._currentContext.asReadonly();
  
  /** Read-only access to memberships */
  readonly memberships = this._memberships.asReadonly();
  
  /** Loading state */
  readonly isLoading = this._isLoading.asReadonly();
  
  /** Check if a context has been selected */
  readonly hasContext = computed(() => this._currentContext() !== null);
  
  /** Check if user has multiple memberships requiring selection */
  readonly requiresContextSelection = computed(() => this._memberships().length > 1);
  
  /** Current company ID from context */
  readonly companyId = computed(() => this._currentContext()?.companyId ?? null);
  
  /** Current role from context */
  readonly role = computed(() => this._currentContext()?.role ?? null);
  
  /** Check if current context is in Expert Mode */
  readonly isExpertMode = computed(() => this._currentContext()?.isExpertMode ?? false);
  
  /** Current company name */
  readonly companyName = computed(() => this._currentContext()?.companyName ?? null);
  
  /** Current permissions */
  readonly permissions = computed(() => this._currentContext()?.permissions ?? []);

  constructor() {
    // Effect to persist context changes to sessionStorage
    effect(() => {
      const context = this._currentContext();
      if (context) {
        sessionStorage.setItem(
          CONTEXT_STORAGE_KEYS.CURRENT_CONTEXT, 
          JSON.stringify(context)
        );
      } else {
        sessionStorage.removeItem(CONTEXT_STORAGE_KEYS.CURRENT_CONTEXT);
      }
    });
    
    // Effect to persist memberships
    effect(() => {
      const memberships = this._memberships();
      if (memberships.length > 0) {
        sessionStorage.setItem(
          CONTEXT_STORAGE_KEYS.MEMBERSHIPS,
          JSON.stringify(memberships)
        );
      } else {
        sessionStorage.removeItem(CONTEXT_STORAGE_KEYS.MEMBERSHIPS);
      }
    });
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Set available memberships for the user (called after login)
   * @param memberships - Array of company memberships
   */
  setMemberships(memberships: CompanyMembership[]): void {
    this._memberships.set(memberships);
  }

  /**
   * Select a context (company + role) from available memberships
   * Persists to sessionStorage and redirects to appropriate dashboard
   * @param membership - The selected membership
   * @param navigate - Whether to navigate after selection (default: true)
   */
  selectContext(membership: CompanyMembership, navigate: boolean = true): void {
    this._isLoading.set(true);

    const context: AppContext = {
      companyId: membership.companyId,
      companyName: membership.companyName,
      role: membership.role,
      isExpertMode: membership.isExpertMode,
      permissions: membership.permissions ?? [],
      selectedAt: new Date()
    };

    this._currentContext.set(context);
    this._isLoading.set(false);

    if (navigate) {
      this.navigateToDashboard(membership.isExpertMode);
    }
  }

  /**
   * Navigate to the appropriate dashboard based on mode
   * @param isExpertMode - Whether to navigate to expert dashboard
   */
  navigateToDashboard(isExpertMode: boolean): void {
    const route = isExpertMode ? '/expert/dashboard' : '/app/dashboard';
    this.router.navigate([route]);
  }

  /**
   * Clear current context (but keep memberships)
   * Used when switching context
   */
  clearContext(): void {
    this._currentContext.set(null);
    sessionStorage.removeItem(CONTEXT_STORAGE_KEYS.CURRENT_CONTEXT);
  }

  /**
   * Full logout - clear all context and memberships
   * Called during logout flow
   */
  clearAll(): void {
    this._currentContext.set(null);
    this._memberships.set([]);
    sessionStorage.removeItem(CONTEXT_STORAGE_KEYS.CURRENT_CONTEXT);
    sessionStorage.removeItem(CONTEXT_STORAGE_KEYS.MEMBERSHIPS);
  }

  /**
   * Check if user has a specific permission in current context
   * @param permission - Permission to check
   */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /**
   * Get the default route based on current context
   */
  getDefaultRoute(): string {
    if (!this.hasContext()) {
      return '/select-context';
    }
    return this.isExpertMode() ? '/expert/dashboard' : '/app/dashboard';
  }

  /**
   * Auto-select context if user has only one membership
   * Returns true if auto-selected, false if manual selection required
   */
  autoSelectIfSingle(): boolean {
    const memberships = this._memberships();
    if (memberships.length === 1) {
      this.selectContext(memberships[0], false);
      return true;
    }
    return false;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Load stored context from sessionStorage
   */
  private loadStoredContext(): AppContext | null {
    try {
      const stored = sessionStorage.getItem(CONTEXT_STORAGE_KEYS.CURRENT_CONTEXT);
      if (stored) {
        const context = JSON.parse(stored) as AppContext;
        // Convert date string back to Date object
        context.selectedAt = new Date(context.selectedAt);
        return context;
      }
    } catch (error) {
      console.warn('Failed to load stored context:', error);
      sessionStorage.removeItem(CONTEXT_STORAGE_KEYS.CURRENT_CONTEXT);
    }
    return null;
  }

  /**
   * Load stored memberships from sessionStorage
   */
  private loadStoredMemberships(): CompanyMembership[] {
    try {
      const stored = sessionStorage.getItem(CONTEXT_STORAGE_KEYS.MEMBERSHIPS);
      if (stored) {
        return JSON.parse(stored) as CompanyMembership[];
      }
    } catch (error) {
      console.warn('Failed to load stored memberships:', error);
      sessionStorage.removeItem(CONTEXT_STORAGE_KEYS.MEMBERSHIPS);
    }
    return [];
  }

  // ============================================
  // LEGACY COMPATIBILITY (deprecated)
  // ============================================

  /** @deprecated Use selectContext() instead */
  setCompany(id: string, role: string): void {
    const membership: CompanyMembership = {
      companyId: id,
      companyName: 'Unknown',
      role: role,
      isExpertMode: false
    };
    this.selectContext(membership, false);
  }
}