// มาจาก GetOrganizations (query ตาราง Organizations ตรง ๆ) - PLEASE-SCAN ไม่มี concept
// ของ Merchant เลย เลยไม่ใช้ AdminMerchant/GetMerchants แบบที่ PLEASE-PAYMENT/PLEASE-ERP ใช้
export type OrganizationItem = {
  id?: string; // OrgId (GUID) ภายใน
  orgId: string; // = OrgCustomId ตัวที่ใช้ใน URL
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: string;
  createdDate?: string;
};

export type AddOrganizationPayload = {
  OrgCustomId: string;
  OrgName: string;
  OrgType: string;
  Tags?: string;
  Email?: string;
  Phone?: string;
};

export type OrgUserItem = {
  orgUserId?: string;
  orgCustomId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  tmpUserEmail?: string | null;
  userStatus?: string;
  createdDate?: string;
  invitedDate?: string;
  invitedBy?: string;
  tags?: string | null;
  roles?: string[];
  rolesList?: string | null;
  isOrgInitialUser?: string | null;
};

export type InviteOrgUserPayload = {
  UserName: string;
  UserEmail: string;
};

export type InviteOrgUserResult = {
  status?: string;
  description?: string;
  orgUser?: OrgUserItem;
  registrationUrl?: string | null;
};

export type AdministratorItem = {
  adminUserId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  tmpUserEmail?: string | null;
  userStatus?: string;
  createdDate?: string;
  invitedBy?: string;
  roles?: string[];
  rolesList?: string | null;
  tags?: string | null;
  customRoleId?: string | null;
  customRoleName?: string | null;
  isOrgInitialUser?: string | null;
};

export type InviteAdministratorPayload = {
  UserName: string;
  UserEmail: string;
  TmpUserEmail?: string;
  CustomRoleId?: string;
  Roles?: string[];
  Tags?: string;
};

export type InviteAdministratorResult = {
  status?: string;
  description?: string;
  adminUser?: AdministratorItem;
  registrationUrl?: string | null;
};

export type UpdateAdministratorPayload = {
  customRoleId?: string;
  CustomRoleId?: string;
  Roles?: string[];
  tags?: string;
};

// ─── System Role (built-in roles like OWNER, VIEWER - not a custom role) ──

export type SystemRole = {
  roleId: string;
  roleName: string;
  roleDescription?: string;
};

// ─── Custom Role ─────────────────────────────────────────────────────────

export type PermissionItem = {
  apiName: string;
  isAllowed: boolean;
};

export type ControllerPermissions = {
  controllerName: string;
  apiPermissions: PermissionItem[];
};

export type CustomRoleItem = {
  roleId: string;
  roleName: string;
  roleDescription?: string;
  tags?: string;
  roleCreatedDate?: string;
  permissions?: ControllerPermissions[];
};

export type AddCustomRolePayload = {
  roleName: string;
  roleDescription?: string;
  tags?: string;
  permissions?: ControllerPermissions[];
};

export type UpdateCustomRolePayload = {
  roleName?: string;
  roleDescription?: string;
  tags?: string;
  permissions?: ControllerPermissions[];
};

// ─── API Key ─────────────────────────────────────────────────────────────

export type ApiKeyItem = {
  keyId: string;
  apiKey?: string | null;
  keyName?: string | null;
  keyDescription?: string | null;
  keyStatus?: string | null;
  keyCreatedDate?: string | null;
  customRoleId?: string | null;
  customRoleName?: string | null;
  rolesList?: string | null;
  roles?: string[];
  tags?: string | null;
};

export type AddApiKeyPayload = {
  keyName: string;
  keyDescription?: string;
  customRoleId?: string;
  tags?: string;
};

export type UpdateApiKeyPayload = {
  keyDescription?: string;
  customRoleId?: string;
  CustomRoleId?: string;
  Roles?: string[];
  tags?: string;
};

// ─── Audit Log ───────────────────────────────────────────────────────────

export type AuditLogItem = {
  id: string;
  "@timestamp": string;
  user_name?: string;
  role?: string;
  action?: string;
  path?: string;
  resource?: string;
  status_code?: number;
  client_ip?: string;
};

export type QueryAuditLogPayload = {
  FullTextSearch?: string;
  Limit?: number;
  Offset?: number;
  ReturnDocs?: boolean;
};

export type AuditLogQueryResult = {
  total: number;
  data?: AuditLogItem[];
};
