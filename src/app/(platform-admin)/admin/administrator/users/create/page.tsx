"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { platformAdminApi } from "@/modules/platform-admin/api/platform-admin.api";
import type { CustomRoleItem, SystemRole } from "@/modules/platform-admin/types/platform-admin.types";
import { RouteConfig } from "@/config/route.config";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LanguageContext";
import { processRegistrationUrl } from "@/lib/registration-url";

type InviteResult = { newId: string; registrationUrl: string | null; userName: string; userEmail: string };

export default function CreateAdministratorPage() {
  const { t } = useLang();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [customRoleId, setCustomRoleId] = useState("");
  const [customRoles, setCustomRoles] = useState<CustomRoleItem[]>([]);
  const [availableRoles, setAvailableRoles] = useState<SystemRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<SystemRole[]>([]);
  const [availableChecked, setAvailableChecked] = useState<Set<string>>(new Set());
  const [selectedChecked, setSelectedChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  const goBack = () => router.push(RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.USER.LIST);

  useEffect(() => {
    platformAdminApi
      .getCustomRoles({ Limit: 100 })
      .then((res) => setCustomRoles(res.data ?? []))
      .catch(() => {});
    platformAdminApi
      .getRoles()
      .then((res) => setAvailableRoles(res.data ?? []))
      .catch(() => {});
  }, []);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim();
      if (!tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const toggleAvailable = (id: string) =>
    setAvailableChecked((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });
  const toggleSelected = (id: string) =>
    setSelectedChecked((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });

  const moveToSelected = () => {
    const moving = availableRoles.filter((r) => availableChecked.has(r.roleId));
    setSelectedRoles((prev) => [...prev, ...moving]);
    setAvailableRoles((prev) => prev.filter((r) => !availableChecked.has(r.roleId)));
    setAvailableChecked(new Set());
  };
  const moveToAvailable = () => {
    const moving = selectedRoles.filter((r) => selectedChecked.has(r.roleId));
    setAvailableRoles((prev) => [...prev, ...moving]);
    setSelectedRoles((prev) => prev.filter((r) => !selectedChecked.has(r.roleId)));
    setSelectedChecked(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      toast.error(t.users.usernameRequired);
      return;
    }
    setSaving(true);
    try {
      const pendingTag = tagInput.trim();
      const finalTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;

      // InviteUserWithLink ไม่รับ CustomRoleId/Roles/Tags ตอน invite - ต้อง update ตามหลังอีกที
      const res = await platformAdminApi.inviteAdministratorWithLink({
        UserName: userName.trim(),
        UserEmail: userEmail.trim(),
        TmpUserEmail: userEmail.trim(),
      });
      const data = res.data;
      const newId = data?.adminUser?.adminUserId;

      if (newId && (selectedRoles.length > 0 || customRoleId || finalTags.length > 0)) {
        await platformAdminApi
          .updateAdministratorById(newId, {
            customRoleId: customRoleId || undefined,
            CustomRoleId: customRoleId || undefined,
            Roles: selectedRoles.length ? selectedRoles.map((r) => r.roleName) : undefined,
            tags: finalTags.length ? finalTags.join(",") : undefined,
          })
          .catch(() => {});
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["platform-admin", "administrators"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["platform-admin", "administrators-count"], refetchType: "all" }),
      ]);
      toast.success(t.users.invitedSuccess);
      setInviteResult({
        newId: newId ?? "",
        registrationUrl: data?.registrationUrl ? processRegistrationUrl(data.registrationUrl) : null,
        userName: userName.trim(),
        userEmail: userEmail.trim(),
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.users.failedToInvite);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!inviteResult?.registrationUrl) return;
    navigator.clipboard.writeText(inviteResult.registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      {inviteResult && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex flex-col items-center text-center px-8 pt-10 pb-6 bg-primary">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-5">
                <Check className="size-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{t.users.inviteSuccessTitle}</h2>
              <p className="text-sm text-white/80">
                {inviteResult.userName} · {inviteResult.userEmail}
              </p>
            </div>
            <div className="px-8 py-7">
              {inviteResult.registrationUrl ? (
                <>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t.users.registrationLink}
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                    <span className="flex-1 text-sm text-gray-800 font-mono break-all select-all">
                      {inviteResult.registrationUrl}
                    </span>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex-shrink-0 p-1.5 rounded-lg transition-colors",
                        copied ? "text-primary" : "text-gray-400 hover:text-primary hover:bg-gray-100"
                      )}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-500 text-center mb-6">{t.users.noRegistrationLink}</p>
              )}
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    inviteResult?.newId
                      ? `${RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.USER.LIST}?highlight=${inviteResult.newId}`
                      : RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.USER.LIST
                  )
                }
              >
                {t.users.doneAndReturn}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">{t.users.createTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <div className="bg-white border rounded-lg p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={t.users.fieldUsername} isRequired value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t.users.fieldUsernamePlaceholder} />
              <Input
                label={t.users.fieldEmail}
                type="email"
                isRequired
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder={t.users.fieldEmailPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.admin.tags}</label>
              <div className="flex flex-wrap gap-1.5 px-3 py-2 min-h-[42px] border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {tag}
                    <button type="button" onClick={() => setTags((p) => p.filter((t) => t !== tag))}>
                      <X className="w-3 h-3 hover:opacity-70" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? t.admin.typeAndPressEnterToAddTags : ""}
                  className="flex-1 min-w-24 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-900">{t.admin.rolesAndPermissions}</h2>

            <div className="max-w-sm space-y-2">
              <label className="text-sm font-medium">{t.admin.customRoleOptional}</label>
              <Select value={customRoleId} onValueChange={setCustomRoleId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t.admin.selectCustomRole} />
                </SelectTrigger>
                <SelectContent>
                  {customRoles.map((r) => (
                    <SelectItem key={r.roleId} value={r.roleId}>
                      {r.roleName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">{t.admin.systemRoles}</label>
            <div className="grid grid-cols-[1fr_48px_1fr] gap-2 items-start">
              <RolePanel
                title={t.admin.availableRoles}
                roles={availableRoles}
                checked={availableChecked}
                onToggle={toggleAvailable}
                emptyText={t.admin.noRolesAvailable}
                countClass="bg-gray-400"
              />
              <div className="flex flex-col gap-2 pt-12 items-center">
                <button
                  type="button"
                  onClick={moveToSelected}
                  disabled={availableChecked.size === 0}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={moveToAvailable}
                  disabled={selectedChecked.size === 0}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <RolePanel
                title={t.admin.selectedRoles}
                roles={selectedRoles}
                checked={selectedChecked}
                onToggle={toggleSelected}
                emptyText={t.admin.noRolesSelected}
                countClass="bg-primary"
              />
            </div>
          </div>

        <div className="sticky bottom-0 -mx-6 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" variant="outline" onClick={goBack}>
            {t.admin.cancel}
          </Button>
          <Button type="submit" isPending={saving}>
            {t.admin.save}
          </Button>
        </div>
      </form>
    </div>
  );
}

function RolePanel({
  title,
  roles,
  checked,
  onToggle,
  emptyText,
  countClass,
}: {
  title: string;
  roles: SystemRole[];
  checked: Set<string>;
  onToggle: (id: string) => void;
  emptyText: string;
  countClass: string;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</span>
        <span className={cn("text-xs font-bold text-white rounded-full px-2 py-0.5", countClass)}>{roles.length}</span>
      </div>
      <div className="min-h-48 max-h-64 overflow-y-auto divide-y divide-gray-100">
        {roles.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">{emptyText}</p>
        ) : (
          roles.map((role) => (
            <label key={role.roleId} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={checked.has(role.roleId)}
                onChange={() => onToggle(role.roleId)}
                className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="text-xs font-bold text-gray-900">{role.roleName}</p>
                {role.roleDescription && <p className="text-xs text-gray-500 mt-0.5">{role.roleDescription}</p>}
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
