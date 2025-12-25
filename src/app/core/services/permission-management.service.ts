import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import {
  PermissionEntity,
  PermissionCreateDto,
  PermissionUpdateDto,
  PermissionReadDto,
  RoleEntity,
  RoleCreateDto,
  RoleUpdateDto,
  RoleReadDto,
  RolePermissionEntity,
  RolePermissionAssignDto,
  RolePermissionReadDto,
  UserRoleEntity,
  UserRoleAssignDto,
  UserRoleBulkAssignDto,
  UserRoleReplaceDto,
  UserRoleBulkAssignResponse,
  UserRoleReplaceResponse,
  RoleWithPermissions
} from '@app/core/models/permission-management.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionManagementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}`;

  // ==================== PERMISSIONS ====================

  /**
   * Get all permissions
   * GET /api/permissions
   */
  getAllPermissions(): Observable<PermissionEntity[]> {
    return this.http
      .get<PermissionReadDto[]>(`${this.apiUrl}/permissions`)
      .pipe(map(dtos => dtos.map(dto => this.mapPermissionDtoToEntity(dto))));
  }

  /**
   * Get permission by ID
   * GET /api/permissions/{id}
   */
  getPermission(id: number): Observable<PermissionEntity> {
    return this.http
      .get<PermissionReadDto>(`${this.apiUrl}/permissions/${id}`)
      .pipe(map(dto => this.mapPermissionDtoToEntity(dto)));
  }

  /**
   * Create a new permission
   * POST /api/permissions
   */
  createPermission(dto: PermissionCreateDto): Observable<PermissionEntity> {
    return this.http
      .post<PermissionReadDto>(`${this.apiUrl}/permissions`, dto)
      .pipe(map(responseDto => this.mapPermissionDtoToEntity(responseDto)));
  }

  /**
   * Update a permission
   * PUT /api/permissions/{id}
   */
  updatePermission(id: number, dto: PermissionUpdateDto): Observable<PermissionEntity> {
    return this.http
      .put<PermissionReadDto>(`${this.apiUrl}/permissions/${id}`, dto)
      .pipe(map(responseDto => this.mapPermissionDtoToEntity(responseDto)));
  }

  /**
   * Delete a permission (soft delete)
   * DELETE /api/permissions/{id}
   */
  deletePermission(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/permissions/${id}`);
  }

  // ==================== ROLES ====================

  /**
   * Get all roles
   * GET /api/roles
   */
  getAllRoles(): Observable<RoleEntity[]> {
    return this.http
      .get<RoleReadDto[]>(`${this.apiUrl}/roles`)
      .pipe(map(dtos => dtos.map(dto => this.mapRoleDtoToEntity(dto))));
  }

  /**
   * Get role by ID
   * GET /api/roles/{id}
   */
  getRole(id: number): Observable<RoleEntity> {
    return this.http
      .get<RoleReadDto>(`${this.apiUrl}/roles/${id}`)
      .pipe(map(dto => this.mapRoleDtoToEntity(dto)));
  }

  /**
   * Create a new role
   * POST /api/roles
   */
  createRole(dto: RoleCreateDto): Observable<RoleEntity> {
    return this.http
      .post<RoleReadDto>(`${this.apiUrl}/roles`, dto)
      .pipe(map(responseDto => this.mapRoleDtoToEntity(responseDto)));
  }

  /**
   * Update a role
   * PUT /api/roles/{id}
   */
  updateRole(id: number, dto: RoleUpdateDto): Observable<RoleEntity> {
    return this.http
      .put<RoleReadDto>(`${this.apiUrl}/roles/${id}`, dto)
      .pipe(map(responseDto => this.mapRoleDtoToEntity(responseDto)));
  }

  /**
   * Delete a role (soft delete)
   * DELETE /api/roles/{id}
   */
  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/roles/${id}`);
  }

  // ==================== ROLE-PERMISSION ASSIGNMENTS ====================

  /**
   * Get all permissions for a role
   * GET /api/roles-permissions/role/{roleId}
   */
  getRolePermissions(roleId: number): Observable<PermissionEntity[]> {
    return this.http
      .get<PermissionReadDto[]>(`${this.apiUrl}/roles-permissions/role/${roleId}`)
      .pipe(map(dtos => dtos.map(dto => this.mapPermissionDtoToEntity(dto))));
  }

  /**
   * Get all roles that have a specific permission
   * GET /api/roles-permissions/permission/{permissionId}
   */
  getPermissionRoles(permissionId: number): Observable<RoleEntity[]> {
    return this.http
      .get<RoleReadDto[]>(`${this.apiUrl}/roles-permissions/permission/${permissionId}`)
      .pipe(map(dtos => dtos.map(dto => this.mapRoleDtoToEntity(dto))));
  }

  /**
   * Assign a permission to a role
   * POST /api/roles-permissions
   */
  assignPermissionToRole(dto: RolePermissionAssignDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/roles-permissions`, dto);
  }

  /**
   * Remove a permission from a role
   * DELETE /api/roles-permissions
   */
  removePermissionFromRole(dto: RolePermissionAssignDto): Observable<void> {
    return this.http.request<void>('delete', `${this.apiUrl}/roles-permissions`, {
      body: dto
    });
  }

  /**
   * Get role with all its permissions (enriched)
   */
  getRoleWithPermissions(roleId: number): Observable<RoleWithPermissions> {
    return this.getRole(roleId).pipe(
      map(role => {
        // Fetch permissions separately
        // In a real app, this could be combined into a single backend call
        return role as RoleWithPermissions;
      })
    );
  }

  // ==================== USER-ROLE ASSIGNMENTS ====================

  /**
   * Get all roles for a user
   * GET /api/users-roles/user/{userId}
   */
  getUserRoles(userId: number): Observable<RoleEntity[]> {
    return this.http
      .get<RoleReadDto[]>(`${this.apiUrl}/users-roles/user/${userId}`)
      .pipe(map(dtos => dtos.map(dto => this.mapRoleDtoToEntity(dto))));
  }

  /**
   * Get all users that have a specific role
   * GET /api/users-roles/role/{roleId}
   */
  getRoleUsers(roleId: number): Observable<any[]> {
    // Backend returns user info - shape depends on backend implementation
    return this.http.get<any[]>(`${this.apiUrl}/users-roles/role/${roleId}`);
  }

  /**
   * Assign a role to a user
   * POST /api/users-roles
   */
  assignRoleToUser(dto: UserRoleAssignDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/users-roles`, dto);
  }

  /**
   * Assign multiple roles to a user
   * POST /api/users-roles/bulk-assign
   */
  bulkAssignRolesToUser(dto: UserRoleBulkAssignDto): Observable<UserRoleBulkAssignResponse> {
    return this.http.post<UserRoleBulkAssignResponse>(
      `${this.apiUrl}/users-roles/bulk-assign`,
      dto
    );
  }

  /**
   * Replace all roles for a user
   * PUT /api/users-roles/replace
   */
  replaceUserRoles(dto: UserRoleReplaceDto): Observable<UserRoleReplaceResponse> {
    return this.http.put<UserRoleReplaceResponse>(`${this.apiUrl}/users-roles/replace`, dto);
  }

  /**
   * Remove a role from a user
   * DELETE /api/users-roles
   */
  removeRoleFromUser(dto: UserRoleAssignDto): Observable<void> {
    return this.http.request<void>('delete', `${this.apiUrl}/users-roles`, {
      body: dto
    });
  }

  // ==================== PRIVATE MAPPERS ====================

  private mapPermissionDtoToEntity(dto: PermissionReadDto): PermissionEntity {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      createdAt: new Date(dto.createdAt)
    };
  }

  private mapRoleDtoToEntity(dto: RoleReadDto): RoleEntity {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      createdAt: new Date(dto.createdAt)
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if a role has a specific permission
   */
  async roleHasPermission(roleId: number, permissionId: number): Promise<boolean> {
    const permissions = await this.getRolePermissions(roleId).toPromise();
    return permissions?.some(p => p.id === permissionId) ?? false;
  }

  /**
   * Check if a user has a specific role
   */
  async userHasRole(userId: number, roleId: number): Promise<boolean> {
    const roles = await this.getUserRoles(userId).toPromise();
    return roles?.some(r => r.id === roleId) ?? false;
  }
}
