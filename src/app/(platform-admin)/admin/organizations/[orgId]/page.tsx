"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Plus, Copy, Check, Ban, CheckCircle, Trash2, Loader, Users, Key, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platformAdminApi } from "@/modules/platform-admin/api/platform-admin.api";
import type { OrgUserItem, SystemRole } from "@/modules/platform-admin/types/platform-admin.types";
import { RouteConfig } from "@/config/route.config";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LanguageContext";
import { processRegistrationUrl, toTenantUrl } from "@/lib/registration-url";
import { ResetLinkModal } from "@/components/ui/reset-link-modal";
import { RowActions } from "@/components/ui/row-actions";
import { useRowHighlight } from "@/modules/platform-admin/hooks/use-row-highlight";

function isUserActive(status?: string | null): boolean {
  return (status || "").toLowerCase() === "active";
}
function isUserPending(status?: string | null): boolean {
  return (status || "").toLowerCase() === "pending";
}

function parseCsv(value?: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function OrganizationDetailContent() {
  const { t } = useLang();
  const router = useRouter();
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const queryClient = useQueryClient();
  const { selectedRowId, selectRow } = useRowHighlight(`platform_admin_org_users_highlight:${orgId}`);

  const [inviteModal, setInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteErrors, setInviteErrors] = useState<{ username?: string; email?: string }>({});
  const [inviting, setInviting] = useState(false);
  const [registrationUrl, setRegistrationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<OrgUserItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgUserItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resetLinkModal, setResetLinkModal] = useState<{ open: boolean; link?: string; loading?: boolean }>({ open: false });
  const [editRoleTarget, setEditRoleTarget] = useState<OrgUserItem | null>(null);

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["platform-admin", "organizations"],
    queryFn: async () => {
      const r = await platformAdminApi.getOrganizations({ Limit: 200 });
      return r.data ?? [];
    },
    select: (list) => list.find((o) => o.orgId === orgId),
  });

  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery({
    queryKey: ["platform-admin", "org-users", orgId],
    queryFn: async () => {
      const r = await platformAdminApi.getOrgUsers(orgId);
      return r.data ?? [];
    },
  });

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["platform-admin", "org-users", orgId], refetchType: "all" });

  const goBack = () => router.push(RouteConfig.PLATFORM_ADMIN.ORGANIZATION.LIST);

  const closeInviteModal = () => {
    setInviteModal(false);
    setInviteUsername("");
    setInviteEmail("");
    setInviteErrors({});
    setRegistrationUrl(null);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { username?: string; email?: string } = {};
    if (!inviteUsername.trim()) errs.username = t.organizations.inviteUsernameRequired;
    if (!inviteEmail.trim()) errs.email = t.organizations.inviteEmailRequired;
    setInviteErrors(errs);
    if (Object.keys(errs).length) return;

    setInviting(true);
    try {
      const res = await platformAdminApi.inviteOrgUser(orgId, {
        UserName: inviteUsername.trim(),
        UserEmail: inviteEmail.trim(),
      });
      if (res.data?.status && res.data.status !== "OK") {
        toast.error(res.data.description || t.organizations.failedToInvite);
        return;
      }
      const rawUrl = res.data?.registrationUrl;
      setRegistrationUrl(rawUrl ? toTenantUrl(processRegistrationUrl(rawUrl)) : null);
      toast.success(t.organizations.invitedSuccess);
      invalidateUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.organizations.failedToInvite);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (!registrationUrl) return;
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleConfirm = async () => {
    if (!toggleTarget?.orgUserId) return;
    setProcessing(true);
    try {
      if (isUserActive(toggleTarget.userStatus)) {
        await platformAdminApi.disableOrgUser(orgId, toggleTarget.orgUserId);
        toast.success(t.organizations.userDisabledSuccess);
      } else {
        await platformAdminApi.enableOrgUser(orgId, toggleTarget.orgUserId);
        toast.success(t.organizations.userEnabledSuccess);
      }
      invalidateUsers();
      setToggleTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.organizations.failedToToggleUser);
    } finally {
      setProcessing(false);
    }
  };

  const handleGetResetLink = async (orgUserId: string) => {
    setResetLinkModal({ open: true, loading: true });
    try {
      const res = await platformAdminApi.getOrgUserForgotPasswordLink(orgId, orgUserId);
      const raw = res.data?.forgotPasswordUrl ?? "";
      setResetLinkModal({ open: true, link: raw ? toTenantUrl(processRegistrationUrl(raw)) : "" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.users.failedToGetResetLink);
      setResetLinkModal({ open: false });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.orgUserId) return;
    setProcessing(true);
    try {
      await platformAdminApi.deleteOrgUser(orgId, deleteTarget.orgUserId);
      toast.success(t.organizations.deleteUserSuccess);
      invalidateUsers();
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.organizations.failedToDeleteUser);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveRoles = async (roles: string[]) => {
    if (!editRoleTarget?.orgUserId) return;
    try {
      await platformAdminApi.updateOrgUser(orgId, editRoleTarget.orgUserId, {
        Roles: roles,
        CustomRoleId: editRoleTarget.customRoleId ?? undefined,
        Tags: editRoleTarget.tags ?? undefined,
      });
      toast.success(t.organizations.updateRoleSuccess);
      selectRow(editRoleTarget.orgUserId);
      invalidateUsers();
      setEditRoleTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.organizations.failedToUpdateRole);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ChevronLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{org?.name || orgId}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orgId}</p>
        </div>
      </div>

      {/* Org info card */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-4">{t.organizations.orgInfoSection}</h2>
        {orgLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-4">
            <Loader className="size-4 animate-spin" />
            <span className="text-sm">{t.admin.loading}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <InfoField label={t.organizations.fieldOrgId} value={org?.orgId} />
            <InfoField label={t.organizations.fieldName} value={org?.name} />
            <InfoField label={t.organizations.fieldEmail} value={org?.contactEmail} />
            <InfoField label={t.organizations.fieldPhone} value={org?.contactPhone} />
          </div>
        )}
      </div>

      {/* Users card */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">{t.organizations.usersTitle}</h2>
          <Button onClick={() => setInviteModal(true)}>
            <Plus className="size-4" />
            {t.organizations.inviteUser}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.organizations.colUsername}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.organizations.colUserEmail}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.admin.tags}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.organizations.colRole}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.organizations.colInitialUser}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.organizations.colUserStatus}</th>
                <th className="w-14 px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.organizations.colAction}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader className="size-4 animate-spin" />
                      <span className="text-sm">{t.admin.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">{t.organizations.noUsersFound}</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const active = isUserActive(u.userStatus);
                  const pending = isUserPending(u.userStatus);
                  const tagList = parseCsv(u.tags);
                  const roleList = u.roles?.length ? u.roles : parseCsv(u.rolesList);
                  const isSelected = !!u.orgUserId && selectedRowId === u.orgUserId;
                  return (
                    <tr
                      key={u.orgUserId}
                      onClick={() => u.orgUserId && selectRow(u.orgUserId)}
                      className={cn(
                        "border-l-[3px] transition-all cursor-pointer",
                        isSelected ? "!bg-primary/10 border-l-primary" : "border-l-transparent hover:bg-gray-50/50"
                      )}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.userName || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{u.userEmail || u.tmpUserEmail || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {tagList.length ? (
                            tagList.map((tag) => (
                              <span key={tag} className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {roleList.length ? (
                            roleList.map((r) => (
                              <span key={r} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary text-white">
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.isOrgInitialUser === "YES" ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-sm text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-sm font-medium", active ? "text-emerald-600" : pending ? "text-orange-500" : "text-gray-400")}>
                          {u.userStatus || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          items={[
                            {
                              label: t.organizations.disableUser,
                              icon: <Ban className="w-4 h-4" />,
                              disabled: !active,
                              danger: true,
                              onClick: () => setToggleTarget(u),
                            },
                            {
                              label: t.organizations.enableUser,
                              icon: <CheckCircle className="w-4 h-4" />,
                              disabled: active || pending,
                              success: true,
                              onClick: () => setToggleTarget(u),
                            },
                            {
                              label: t.organizations.deleteUser,
                              icon: <Trash2 className="w-4 h-4" />,
                              disabled: !pending,
                              danger: true,
                              onClick: () => setDeleteTarget(u),
                            },
                            {
                              label: t.organizations.editRole,
                              icon: <Shield className="w-4 h-4" />,
                              disabled: !u.orgUserId,
                              onClick: () => setEditRoleTarget(u),
                            },
                            {
                              label: t.users.resetPasswordLink,
                              icon: <Key className="w-4 h-4" />,
                              disabled: !u.orgUserId || !active,
                              onClick: () => u.orgUserId && handleGetResetLink(u.orgUserId),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal */}
      {inviteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeInviteModal}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{t.organizations.inviteModalTitle}</h3>
            </div>

            {registrationUrl ? (
              <div className="px-6 py-5">
                <p className="text-sm font-semibold text-gray-700 mb-1">{t.organizations.inviteLinkLabel}</p>
                <p className="text-xs text-gray-500 mb-3">{t.organizations.inviteLinkDesc}</p>
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="flex-1 text-sm text-gray-800 font-mono break-all select-all">{registrationUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "flex-shrink-0 p-1.5 rounded-lg transition-colors",
                      copied ? "text-primary" : "text-gray-400 hover:text-primary hover:bg-gray-100"
                    )}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-5">
                  <Button onClick={closeInviteModal}>{t.organizations.inviteDone}</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="px-6 py-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    {t.organizations.colUsername} <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={inviteUsername}
                    onChange={(e) => {
                      setInviteUsername(e.target.value);
                      setInviteErrors((p) => ({ ...p, username: "" }));
                    }}
                    placeholder={t.organizations.inviteUsernamePlaceholder}
                    autoFocus
                    className={cn(
                      "w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent",
                      inviteErrors.username ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
                    )}
                  />
                  {inviteErrors.username && <p className="text-red-500 text-xs mt-1">{inviteErrors.username}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    {t.organizations.colUserEmail} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      setInviteErrors((p) => ({ ...p, email: "" }));
                    }}
                    placeholder={t.organizations.inviteEmailPlaceholder}
                    className={cn(
                      "w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent",
                      inviteErrors.email ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-primary"
                    )}
                  />
                  {inviteErrors.email && <p className="text-red-500 text-xs mt-1">{inviteErrors.email}</p>}
                </div>
                <div className="flex justify-end gap-3 mt-1">
                  <Button type="button" variant="outline" onClick={closeInviteModal}>
                    {t.admin.cancel}
                  </Button>
                  <Button type="submit" isPending={inviting}>
                    {t.organizations.inviteUser}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Toggle confirm modal */}
      {toggleTarget && (
        <ConfirmModal
          title={isUserActive(toggleTarget.userStatus) ? t.organizations.confirmDisableUserTitle : t.organizations.confirmEnableUserTitle}
          danger={isUserActive(toggleTarget.userStatus)}
          processing={processing}
          onCancel={() => setToggleTarget(null)}
          onConfirm={handleToggleConfirm}
          cancelLabel={t.admin.cancel}
          confirmLabel={t.admin.yes}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <ConfirmModal
          title={t.organizations.confirmDeleteUserTitle}
          desc={t.organizations.confirmDeleteUserDesc}
          danger
          processing={processing}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          cancelLabel={t.admin.cancel}
          confirmLabel={t.organizations.deleteUser}
        />
      )}

      {resetLinkModal.open && (
        <ResetLinkModal
          link={resetLinkModal.link}
          loading={resetLinkModal.loading}
          onClose={() => setResetLinkModal({ open: false })}
        />
      )}

      {editRoleTarget && (
        <EditRoleModal
          target={editRoleTarget}
          onCancel={() => setEditRoleTarget(null)}
          onSave={handleSaveRoles}
        />
      )}
    </div>
  );
}

export default function OrganizationDetailPage() {
  return (
    <Suspense>
      <OrganizationDetailContent />
    </Suspense>
  );
}

function EditRoleModal({
  target,
  onCancel,
  onSave,
}: {
  target: OrgUserItem;
  onCancel: () => void;
  onSave: (roles: string[]) => Promise<void>;
}) {
  const { t } = useLang();
  const [availableRoles, setAvailableRoles] = useState<SystemRole[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(target.roles?.length ? target.roles : parseCsv(target.rolesList))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    platformAdminApi
      .getRoles()
      .then((res) => setAvailableRoles(res.data ?? []))
      .catch(() => toast.error(t.organizations.failedToLoadRoles))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleRole = (roleName: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(roleName)) s.delete(roleName);
      else s.add(roleName);
      return s;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave([...selected]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{t.organizations.editRoleTitle}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{target.userName}</p>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">{t.admin.loading}</span>
            </div>
          ) : availableRoles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t.admin.noRolesAvailable}</p>
          ) : (
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {availableRoles.map((role) => (
                <label key={role.roleId} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(role.roleName)}
                    onChange={() => toggleRole(role.roleName)}
                    className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{role.roleName}</p>
                    {role.roleDescription && <p className="text-xs text-gray-500 mt-0.5">{role.roleDescription}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            {t.admin.cancel}
          </Button>
          <Button type="button" onClick={handleSave} isPending={saving} disabled={loading}>
            {t.admin.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value || "-"}</p>
    </div>
  );
}

function ConfirmModal({
  title,
  desc,
  danger,
  processing,
  onCancel,
  onConfirm,
  cancelLabel,
  confirmLabel,
}: {
  title: string;
  desc?: string;
  danger?: boolean;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel: string;
  confirmLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-5 text-center">
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4", danger ? "bg-red-100" : "bg-emerald-100")}>
            {danger ? <Ban className="w-5 h-5 text-red-600" /> : <CheckCircle className="w-5 h-5 text-emerald-600" />}
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
          {desc && <p className="text-sm text-gray-500">{desc}</p>}
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className={cn(
              "flex-1 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-colors",
              danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
