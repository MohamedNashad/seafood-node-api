// types/auth-types.ts
export type Permission = string;
export type Role = string;

export interface DetailedRolePermission {
    roleName: string;
    permissions: Permission[];
}

export interface UserRolesAndPermissions {
    userId: string;
    roles: Role[];
    permissions: Permission[];
    detailedRolesAndPermissions: DetailedRolePermission[];
}
