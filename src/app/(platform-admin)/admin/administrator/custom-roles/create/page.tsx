"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Loader, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { platformAdminApi } from "@/modules/platform-admin/api/platform-admin.api";
import type { ControllerPermissions } from "@/modules/platform-admin/types/platform-admin.types";
import { RouteConfig } from "@/config/route.config";
import { useLang } from "@/context/LanguageContext";

export default function CreateCustomRolePage() {
  const { t } = useLang();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [permGroups, setPermGroups] = useState<ControllerPermissions[]>([]);
  const [permSearch, setPermSearch] = useState("");
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [saving, setSaving] = useState(false);

  const goBack = () => router.push(RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.CUSTOM_ROLE.LIST);

  useEffect(() => {
    platformAdminApi
      .getInitialUserRolePermissions()
      .then((res) => setPermGroups(res.data?.permissions ?? []))
      .catch(() => toast.error(t.customRoles.failedToLoadPerms))
      .finally(() => setLoadingPerms(false));
  }, []);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim();
      if (!tags.includes(tag)) setTags((prev) => [...prev, tag]);
      setTagInput("");
    }
  };

  const toggleController = (controllerName: string, value: boolean) => {
    setPermGroups((prev) =>
      prev.map((g) =>
        g.controllerName !== controllerName
          ? g
          : { ...g, apiPermissions: g.apiPermissions.map((p) => ({ ...p, isAllowed: value })) }
      )
    );
  };

  const togglePermission = (controllerName: string, apiName: string) => {
    setPermGroups((prev) =>
      prev.map((g) =>
        g.controllerName !== controllerName
          ? g
          : {
              ...g,
              apiPermissions: g.apiPermissions.map((p) =>
                p.apiName !== apiName ? p : { ...p, isAllowed: !p.isAllowed }
              ),
            }
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error(t.customRoles.roleNameRequired);
      return;
    }
    setSaving(true);
    try {
      const pendingTag = tagInput.trim();
      const finalTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;
      const res = await platformAdminApi.addCustomRole({
        roleName: roleName.trim(),
        roleDescription: roleDescription.trim() || undefined,
        tags: finalTags.length ? finalTags.join(",") : undefined,
        permissions: permGroups,
      });
      const newId = res.data?.customRole?.roleId;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["platform-admin", "custom-roles"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["platform-admin", "custom-roles-count"], refetchType: "all" }),
      ]);
      toast.success(t.customRoles.createdSuccess);
      router.push(
        newId
          ? `${RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.CUSTOM_ROLE.LIST}?highlight=${newId}`
          : RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.CUSTOM_ROLE.LIST
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.customRoles.failedToCreate);
    } finally {
      setSaving(false);
    }
  };

  const q = permSearch.toLowerCase();
  const filteredGroups = permGroups
    .map((g) => ({
      ...g,
      apiPermissions: q ? g.apiPermissions.filter((p) => p.apiName.toLowerCase().includes(q)) : g.apiPermissions,
    }))
    .filter((g) => g.apiPermissions.length > 0 || g.controllerName.toLowerCase().includes(q));

  const totalSelected = permGroups.reduce((s, g) => s + g.apiPermissions.filter((p) => p.isAllowed).length, 0);
  const totalPerms = permGroups.reduce((s, g) => s + g.apiPermissions.length, 0);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">{t.customRoles.createTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <div className="bg-white border rounded-lg p-6 flex flex-col gap-4">
            <Input label={t.customRoles.fieldRoleName} isRequired value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder={t.customRoles.fieldRoleNamePlaceholder} />
            <Input label={t.customRoles.fieldDescription} value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder={t.customRoles.fieldDescPlaceholder} />
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
                  placeholder={tags.length === 0 ? t.customRoles.typeAndPressEnterToAddTag : ""}
                  className="flex-1 min-w-24 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{t.customRoles.permissionsSection}</h2>
              {totalPerms > 0 && (
                <span className="text-xs text-gray-400">
                  {totalSelected} / {totalPerms} {t.customRoles.selectedCount}
                </span>
              )}
            </div>

            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder={t.customRoles.searchPermissions}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              />
            </div>

            <div className="border rounded-lg overflow-hidden min-h-48 max-h-96 overflow-y-auto divide-y transform-gpu">
              {loadingPerms ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
                  <Loader className="size-4 animate-spin" />
                  <span className="text-sm">{t.customRoles.loadingPermissions}</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">{t.customRoles.noPermissionsFound}</p>
              ) : (
                filteredGroups.map((group) => {
                  const allChecked = group.apiPermissions.length > 0 && group.apiPermissions.every((p) => p.isAllowed);
                  return (
                    <div key={group.controllerName}>
                      <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100">
                        <Checkbox checked={allChecked} onCheckedChange={(v) => toggleController(group.controllerName, !!v)} />
                        <span className="text-sm font-semibold text-gray-800">{group.controllerName}</span>
                      </label>
                      {group.apiPermissions.map((perm) => (
                        <label
                          key={perm.apiName}
                          className="flex items-center gap-3 px-4 py-2.5 pl-11 cursor-pointer hover:bg-gray-50 border-t"
                        >
                          <Checkbox
                            checked={perm.isAllowed}
                            onCheckedChange={() => togglePermission(group.controllerName, perm.apiName)}
                          />
                          <span className="text-sm text-gray-700">{perm.apiName}</span>
                        </label>
                      ))}
                    </div>
                  );
                })
              )}
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
