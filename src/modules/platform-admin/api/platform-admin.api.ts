import { api } from "@/lib/axios";
import type {
  OrganizationItem,
  AddOrganizationPayload,
  OrgUserItem,
  InviteOrgUserPayload,
  InviteOrgUserResult,
  AdministratorItem,
  InviteAdministratorPayload,
  InviteAdministratorResult,
  UpdateAdministratorPayload,
  SystemRole,
  CustomRoleItem,
  AddCustomRolePayload,
  UpdateCustomRolePayload,
  ControllerPermissions,
  ApiKeyItem,
  AddApiKeyPayload,
  UpdateApiKeyPayload,
  QueryAuditLogPayload,
  AuditLogQueryResult,
  AuditLogItem,
} from "../types/platform-admin.types";

const ORG_BASE = "/admin-api/AdminOrganization/org/global/action";
const ADMIN_USER_BASE = "/admin-api/AdminUser/org/global/action";
const CUSTOM_ROLE_BASE = "/admin-api/AdminCustomRole/org/global/action";
const API_KEY_BASE = "/admin-api/AdminApiKey/org/global/action";
const AUDIT_LOG_BASE = "/admin-api/AdminAuditLog/org/global/action";
const ROLE_BASE = "/admin-api/AdminRole/org/global/action";

// Response wrapper shapes onix-v2-api uses for these single-item endpoints
// (Status/Description + the actual item under a lowerCamelCase field name).
type MV<K extends string, T> = { status?: string; description?: string } & { [P in K]?: T };

// รูปแบบดิบที่ GetOrganizations คืนมาตรง ๆ จากตาราง Organizations (camelCase ตาม MOrganization)
type RawOrganization = {
  orgId?: string; // GUID ภายใน ไม่ใช่ตัวที่ใช้ใน URL
  orgCustomId?: string;
  orgName?: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  orgCreatedDate?: string;
};

function mapOrganization(o: RawOrganization): OrganizationItem {
  return {
    id: o.orgId,
    orgId: o.orgCustomId ?? "",
    name: o.orgName ?? "",
    contactEmail: o.email ?? undefined,
    contactPhone: o.phone ?? undefined,
    status: o.status ?? undefined,
    createdDate: o.orgCreatedDate,
  };
}

// PLEASE-SCAN ไม่มี concept ของ Merchant เลย - list องค์กรต้อง query จากตาราง Organizations
// ตรง ๆ (GetOrganizations) ไม่ใช้ AdminMerchant/GetMerchants เหมือนที่เคยทำ (นั่นสำหรับ
// PLEASE-PAYMENT/PLEASE-ERP เท่านั้น ซึ่งมี Merchant คู่กันจริง)
export const platformAdminApi = {
  getOrganizations: async (payload: Record<string, unknown> = {}) => {
    const r = await api.post<RawOrganization[]>(`${ORG_BASE}/GetOrganizations`, {
      OrgType: "PLEASE-SCAN",
      ...payload,
    });
    return { ...r, data: (r.data ?? []).map(mapOrganization) };
  },

  getOrganizationCount: (payload: Record<string, unknown> = {}) =>
    api.post<number>(`${ORG_BASE}/GetOrganizationCount`, { OrgType: "PLEASE-SCAN", ...payload }),

  addOrganization: (payload: AddOrganizationPayload) =>
    api.post<{ status?: string; description?: string }>(`${ORG_BASE}/AddOrganization`, payload),

  getOrgUsers: (orgCustomId: string) =>
    api.get<OrgUserItem[]>(`${ORG_BASE}/GetOrgUsers/${orgCustomId}`),

  inviteOrgUser: (orgCustomId: string, payload: InviteOrgUserPayload) =>
    api.post<InviteOrgUserResult>(`${ORG_BASE}/InviteOrganizationUser/${orgCustomId}`, payload),

  enableOrgUser: (orgCustomId: string, orgUserId: string) =>
    api.post(`${ORG_BASE}/EnableOrgUserById/${orgCustomId}/${orgUserId}`),

  disableOrgUser: (orgCustomId: string, orgUserId: string) =>
    api.post(`${ORG_BASE}/DisableOrgUserById/${orgCustomId}/${orgUserId}`),

  deleteOrgUser: (orgCustomId: string, orgUserId: string) =>
    api.delete(`${ORG_BASE}/DeleteOrgUserById/${orgCustomId}/${orgUserId}`),

  getOrgUserForgotPasswordLink: (orgCustomId: string, orgUserId: string) =>
    api.get<{ status?: string; description?: string; forgotPasswordUrl?: string }>(
      `${ORG_BASE}/GetOrgUserForgotPasswordLink/${orgCustomId}/${orgUserId}`
    ),

  // Administrator = บัญชีใน table AdminUsers (คนละส่วนกับ user ของแต่ละ org)
  getAdministrators: (payload: Record<string, unknown> = {}) =>
    api.post<AdministratorItem[]>(`${ADMIN_USER_BASE}/GetUsers`, payload),

  getAdministratorCount: (payload: Record<string, unknown> = {}) =>
    api.post<number>(`${ADMIN_USER_BASE}/GetUserCount`, payload),

  inviteAdministrator: (payload: InviteAdministratorPayload) =>
    api.post(`${ADMIN_USER_BASE}/InviteUser`, payload),

  // ใช้ตัวนี้แทนตอน invite จากหน้า UI - ได้ registrationUrl กลับมาให้ copy ส่งต่อ user ทันที
  inviteAdministratorWithLink: (payload: InviteAdministratorPayload) =>
    api.post<InviteAdministratorResult>(`${ADMIN_USER_BASE}/InviteUserWithLink`, payload),

  getAdministratorById: (userId: string) =>
    api.get<MV<"adminUser", AdministratorItem>>(`${ADMIN_USER_BASE}/GetUserById/${userId}`),

  updateAdministratorById: (userId: string, payload: UpdateAdministratorPayload) =>
    api.post(`${ADMIN_USER_BASE}/UpdateUserById/${userId}`, payload),

  enableAdministrator: (userId: string) =>
    api.post(`${ADMIN_USER_BASE}/EnableUserById/${userId}`),

  disableAdministrator: (userId: string) =>
    api.post(`${ADMIN_USER_BASE}/DisableUserById/${userId}`),

  deleteAdministratorById: (userId: string) =>
    api.delete(`${ADMIN_USER_BASE}/DeleteUserById/${userId}`),

  getForgotPasswordLink: (userId: string) =>
    api.get<{ forgotPasswordUrl?: string; resetLink?: string }>(`${ADMIN_USER_BASE}/GetForgotPasswordLink/${userId}`),

  // ─── System Role (built-in roles like OWNER/VIEWER, separate from Custom Role) ──
  // Response body เป็น raw array ตรง ๆ เหมือน GetCustomRoles/GetApiKeys ไม่ได้ wrap เป็น { roles: [...] }
  getRoles: () => api.post<SystemRole[]>(`${ROLE_BASE}/GetRoles`, {}),

  // ─── Custom Role ─────────────────────────────────────────────────────
  getCustomRoles: (payload: Record<string, unknown> = {}) =>
    api.post<CustomRoleItem[]>(`${CUSTOM_ROLE_BASE}/GetCustomRoles`, payload),

  getCustomRoleCount: (payload: Record<string, unknown> = {}) =>
    api.post<number>(`${CUSTOM_ROLE_BASE}/GetCustomRoleCount`, payload),

  getInitialUserRolePermissions: () =>
    api.get<{ permissions: ControllerPermissions[] }>(
      `${CUSTOM_ROLE_BASE}/GetInitialUserRolePermissions`
    ),

  addCustomRole: (payload: AddCustomRolePayload) =>
    api.post<MV<"customRole", CustomRoleItem>>(`${CUSTOM_ROLE_BASE}/AddCustomRole`, payload),

  getCustomRoleById: (roleId: string) =>
    api.get<MV<"customRole", CustomRoleItem>>(`${CUSTOM_ROLE_BASE}/GetCustomRoleById/${roleId}`),

  updateCustomRoleById: (roleId: string, payload: UpdateCustomRolePayload) =>
    api.post(`${CUSTOM_ROLE_BASE}/UpdateCustomRoleById/${roleId}`, payload),

  deleteCustomRoleById: (roleId: string) =>
    api.delete(`${CUSTOM_ROLE_BASE}/DeleteCustomRoleById/${roleId}`),

  // ─── API Key ─────────────────────────────────────────────────────────
  getApiKeys: (payload: Record<string, unknown> = {}) =>
    api.post<ApiKeyItem[]>(`${API_KEY_BASE}/GetApiKeys`, payload),

  getApiKeyCount: (payload: Record<string, unknown> = {}) =>
    api.post<number>(`${API_KEY_BASE}/GetApiKeyCount`, payload),

  addApiKey: (payload: AddApiKeyPayload) =>
    api.post<MV<"apiKey", ApiKeyItem>>(`${API_KEY_BASE}/AddApiKey`, payload),

  getApiKeyById: (keyId: string) =>
    api.get<MV<"apiKey", ApiKeyItem>>(`${API_KEY_BASE}/GetApiKeyById/${keyId}`),

  updateApiKeyById: (keyId: string, payload: UpdateApiKeyPayload) =>
    api.post(`${API_KEY_BASE}/UpdateApiKeyById/${keyId}`, payload),

  enableApiKey: (keyId: string) =>
    api.post(`${API_KEY_BASE}/EnableApiKeyById/${keyId}`),

  disableApiKey: (keyId: string) =>
    api.post(`${API_KEY_BASE}/DisableApiKeyById/${keyId}`),

  deleteApiKeyById: (keyId: string) =>
    api.delete(`${API_KEY_BASE}/DeleteApiKeyById/${keyId}`),

  // ─── Audit Log ───────────────────────────────────────────────────────
  queryAuditLogs: (payload: QueryAuditLogPayload = {}) =>
    api.post<AuditLogQueryResult>(`${AUDIT_LOG_BASE}/QueryAuditLogs`, payload),

  getAuditLogById: (id: string) =>
    api.get<AuditLogItem>(`${AUDIT_LOG_BASE}/GetAuditLogById/${id}`),
};
