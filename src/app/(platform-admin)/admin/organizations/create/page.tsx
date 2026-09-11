"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { platformAdminApi } from "@/modules/platform-admin/api/platform-admin.api";
import { RouteConfig } from "@/config/route.config";
import { useLang } from "@/context/LanguageContext";

export default function CreateOrganizationPage() {
  const { t } = useLang();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const goBack = () => router.push(RouteConfig.PLATFORM_ADMIN.ORGANIZATION.LIST);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId.trim() || !orgName.trim()) {
      toast.error(t.organizations.orgIdRequired);
      return;
    }
    setSaving(true);
    try {
      const res = await platformAdminApi.addOrganization({
        OrgCustomId: orgId.trim(),
        OrgName: orgName.trim(),
        OrgType: "PLEASE-SCAN",
        Email: contactEmail.trim() || undefined,
        Phone: contactPhone.trim() || undefined,
      });
      // backend คืน HTTP 200 เสมอแม้ validation ผิด (เช่น org id ซ้ำ) ต้องเช็ค status เอง
      if (res.data?.status && res.data.status !== "OK") {
        toast.error(res.data.description || t.organizations.failedToCreate);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["platform-admin", "organizations"], refetchType: "all" });
      toast.success(t.organizations.createdSuccess);
      router.push(`${RouteConfig.PLATFORM_ADMIN.ORGANIZATION.LIST}?highlight=${orgId.trim()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.organizations.failedToCreate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={goBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">{t.organizations.createTitle}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        <div className="bg-white border rounded-lg p-6 flex flex-col gap-4">
          <Input
            label={t.organizations.fieldOrgId}
            isRequired
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="e.g. acme-corp"
          />
          <Input
            label={t.organizations.fieldName}
            isRequired
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Acme Corp"
          />
          <Input
            label={t.organizations.fieldEmail}
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          <Input
            label={t.organizations.fieldPhone}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
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
