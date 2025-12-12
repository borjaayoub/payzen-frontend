import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { 
  User, 
  UserRole,
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  AuthState,
  ROLE_PERMISSIONS 
} from '@app/core/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // API endpoint
  private readonly API_URL = `${environment.apiUrl}/auth`;
  
  // Storage keys
  private readonly TOKEN_KEY = 'payzen_auth_token';
  private readonly USER_KEY = 'payzen_user';
  private readonly REFRESH_TOKEN_KEY = 'payzen_refresh_token';

  // Auth state signals
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: this.getStoredUser(),
    token: this.getStoredToken(),
    isAuthenticated: !!this.getStoredToken(),
    isLoading: false,
    error: null
  });

  // Public observables
  authState$ = this.authStateSubject.asObservable();
  
  // Signals for reactive components
  currentUser = signal<User | null>(this.getStoredUser());
  isAuthenticated = signal<boolean>(!!this.getStoredToken());
  isLoading = signal<boolean>(false);

  // Computed signals
  userRole = computed(() => this.currentUser()?.role);
  isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN || this.currentUser()?.role === UserRole.ADMIN_PAYZEN);
  isRH = computed(() => this.currentUser()?.role === UserRole.RH);
  isManager = computed(() => this.currentUser()?.role === UserRole.MANAGER);
  isEmployee = computed(() => this.currentUser()?.role === UserRole.EMPLOYEE);
  isCabinet = computed(() => this.currentUser()?.role === UserRole.CABINET);
  isAdminPayZen = computed(() => this.currentUser()?.role === UserRole.ADMIN_PAYZEN);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Initialize auth state from storage
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from storage
   */
  private initializeAuth(): void {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.updateAuthState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    }
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.updateAuthState({ ...this.authStateSubject.value, isLoading: true, error: null });

    return this.http.post<any>(`${this.API_URL}/login`, credentials).pipe(
      map(response => this.normalizeLoginResponse(response)),
      tap(response => {
        this.handleLoginSuccess(response);
      }),
      catchError(error => {
        this.handleAuthError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle successful login
   */
  private handleLoginSuccess(response: LoginResponse): void {
    // Store tokens and user
    this.storeToken(response.token);
    this.storeUser(response.user);
    if (response.refreshToken) {
      this.storeRefreshToken(response.refreshToken);
    }

    // Update state
    this.currentUser.set(response.user);
    this.isAuthenticated.set(true);
    this.isLoading.set(false);
    
    this.updateAuthState({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });

    // Navigate to role-specific route
    const defaultRoute = this.getRoleDefaultRoute(response.user.role);
    this.router.navigate([defaultRoute]);
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<LoginResponse> {
    this.isLoading.set(true);
    
    return this.http.post<any>(`${this.API_URL}/register`, data).pipe(
      map(response => this.normalizeLoginResponse(response)),
      tap(response => {
        this.handleLoginSuccess(response);
      }),
      catchError(error => {
        this.handleAuthError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear storage
    this.clearStorage();
    
    // Reset state
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isLoading.set(false);
    
    this.updateAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });

    // Navigate to login
    this.router.navigate(['/login']);
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getStoredRefreshToken();
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const cachedUser = this.currentUser();

    return this.http.post<any>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      map(response => this.normalizeLoginResponse(response, cachedUser)),
      tap(response => {
        this.storeToken(response.token);
        if (response.refreshToken) {
          this.storeRefreshToken(response.refreshToken);
        }
        this.storeUser(response.user);
        this.currentUser.set(response.user);
        this.updateAuthState({
          ...this.authStateSubject.value,
          user: response.user,
          token: response.token,
          isAuthenticated: true
        });
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.getStoredToken();
  }

  /**
   * Get auth headers
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: any): void {
    const errorMessage = error.error?.message || error.message || 'Authentication failed';
    
    this.isLoading.set(false);
    this.updateAuthState({
      ...this.authStateSubject.value,
      isLoading: false,
      error: errorMessage
    });
  }

  /**
   * Update auth state
   */
  private updateAuthState(state: AuthState): void {
    this.authStateSubject.next(state);
  }

  // Storage methods
  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private storeRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private normalizeLoginResponse(payload: any, fallbackUser: User | null = null): LoginResponse {
    const token = this.extractToken(payload);
    const refreshToken = this.extractRefreshToken(payload);
    const backendUser = payload?.user ?? payload?.User ?? null;

    let user: User | null = null;
    if (backendUser) {
      user = this.normalizeUserPayload(backendUser);
    } else if (fallbackUser) {
      user = fallbackUser;
    }

    if (!user) {
      throw new Error('Invalid auth response: missing user payload');
    }

    return {
      user,
      token,
      refreshToken: refreshToken ?? undefined
    };
  }

  private extractToken(payload: any): string {
    const token = payload?.token ?? payload?.Token ?? null;
    if (!token) {
      throw new Error('Invalid auth response: missing token');
    }
    return String(token);
  }

  private extractRefreshToken(payload: any): string | null {
    const refreshToken = payload?.refreshToken ?? payload?.RefreshToken ?? null;
    return refreshToken ? String(refreshToken) : null;
  }

  private normalizeUserPayload(userRaw: any): User {
    const permissions = Array.isArray(userRaw?.permissions) ? userRaw.permissions : [];
    const rolesArray = Array.isArray(userRaw?.roles) ? userRaw.roles : [];
    const resolvedRole = userRaw?.role ?? rolesArray[0];
    return {
      id: this.normalizeString(userRaw?.id) ?? '',
      email: this.normalizeString(userRaw?.email) ?? '',
      username: this.normalizeString(userRaw?.username) ?? '',
      firstName: this.normalizeString(userRaw?.firstName) ?? '',
      lastName: this.normalizeString(userRaw?.lastName) ?? '',
      role: this.mapBackendRole(resolvedRole),
      employee_id: this.normalizeString(userRaw?.employeeId),
      companyId: this.normalizeString(userRaw?.companyId),
      permissions
    };
  }

  private normalizeString(value: any): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    return String(value);
  }

  private mapBackendRole(role?: string): UserRole {
    const normalized = (role ?? '').toLowerCase();
    const roleMap: Record<string, UserRole> = {
      admin: UserRole.ADMIN,
      rh: UserRole.RH,
      manager: UserRole.MANAGER,
      employee: UserRole.EMPLOYEE,
      cabinet: UserRole.CABINET,
      admin_payzen: UserRole.ADMIN_PAYZEN
    };
    return roleMap[normalized] ?? UserRole.EMPLOYEE;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: keyof typeof ROLE_PERMISSIONS[UserRole]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole];
    return rolePermissions ? rolePermissions[permission] : false;
  }

  /**
   * Check if user has one of the specified roles
   */
  hasRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role as UserRole);
  }

  /**
   * Resolve default route for a given role
   */
  getRoleDefaultRoute(role: string): string {
    const roleRoutes: Record<string, string> = {
      [UserRole.ADMIN]: '/dashboard',
      [UserRole.RH]: '/dashboard',
      [UserRole.MANAGER]: '/employees',
      [UserRole.EMPLOYEE]: '/my-profile',
      [UserRole.CABINET]: '/companies',
      [UserRole.ADMIN_PAYZEN]: '/admin/dashboard'
    };

    return roleRoutes[role] || '/dashboard';
  }
}

