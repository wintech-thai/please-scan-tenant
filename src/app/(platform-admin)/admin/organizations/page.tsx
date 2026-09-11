"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { platformAdminApi } from "@/modules/platform-admin/api/platform-admin.api";
import { Button } from "@/components/ui/button";
import { RouteConfig } from "@/config/route.config";
import { Loader, Plus } from "lucide-react";
import { useLang } from "@/context/LanguageContext";

export default function OrganizationsListPage() {
  const { t } = useLang();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-admin", "organizations"],
    queryFn: async () => {
      const r = await platformAdminApi.getOrganizations({ Limit: 200 });
      return r.data ?? [];
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t.organizations.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.organizations.subtitle}</p>
        </div>
        <Button asChild>
          <Link href={RouteConfig.PLATFORM_ADMIN.ORGANIZATION.CREATE}>
            <Plus className="size-4" />
            {t.organizations.addOrganization}
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader className="size-5 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-destructive">{t.organizations.failedToLoad}</div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">{t.organizations.noOrganizationsFound}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t.organizations.colOrgId}</th>
                <th className="px-4 py-3 font-medium">{t.organizations.colName}</th>
                <th className="px-4 py-3 font-medium">{t.organizations.colContact}</th>
                <th className="px-4 py-3 font-medium">{t.organizations.colStatus}</th>
                <th className="px-4 py-3 font-medium">{t.organizations.colCreated}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((org) => (
                <tr key={org.orgId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{org.orgId}</td>
                  <td className="px-4 py-3">{org.name}</td>
                  <td className="px-4 py-3 text-gray-500">{org.contactEmail || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                      {org.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {org.createdDate ? new Date(org.createdDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={RouteConfig.PLATFORM_ADMIN.ORGANIZATION.VIEW(org.orgId)}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      {t.organizations.manageUsers}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
