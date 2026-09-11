"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { platformAdminApi } from "@/modules/platform-admin/api/platform-admin.api";
import { Button } from "@/components/ui/button";
import { RouteConfig } from "@/config/route.config";
import { Loader, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { useRowHighlight } from "@/modules/platform-admin/hooks/use-row-highlight";
import { cn } from "@/lib/utils";

function OrganizationsListContent() {
  const { t } = useLang();
  const { selectedRowId, selectRow } = useRowHighlight("platform_admin_organizations_highlight");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const offset = (page - 1) * itemsPerPage;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-admin", "organizations", appliedSearch, offset, itemsPerPage],
    queryFn: async () => {
      const r = await platformAdminApi.getOrganizations({
        FullTextSearch: appliedSearch || undefined,
        Offset: offset,
        Limit: itemsPerPage,
      });
      return r.data ?? [];
    },
  });

  const { data: total = 0 } = useQuery({
    queryKey: ["platform-admin", "organizations-count", appliedSearch],
    queryFn: async () => {
      const r = await platformAdminApi.getOrganizationCount({ FullTextSearch: appliedSearch || undefined });
      return r.data ?? 0;
    },
  });

  const handleSearchTrigger = () => {
    setAppliedSearch(searchTerm);
    setPage(1);
  };

  const startRow = total === 0 ? 0 : offset + 1;
  const endRow = Math.min(offset + itemsPerPage, total);
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t.organizations.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.organizations.subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center px-6 py-4 border-b border-gray-100">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
              placeholder={t.organizations.searchPlaceholder}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 sm:min-w-[220px]"
            />
            <button
              onClick={handleSearchTrigger}
              className="px-4 py-2 bg-primary hover:opacity-90 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <Button asChild>
            <Link href={RouteConfig.PLATFORM_ADMIN.ORGANIZATION.CREATE}>
              <Plus className="size-4" />
              {t.organizations.addOrganization}
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">{t.organizations.colOrgId}</th>
                <th className="px-6 py-3.5">{t.organizations.colName}</th>
                <th className="px-6 py-3.5">{t.organizations.colContact}</th>
                <th className="px-6 py-3.5">{t.organizations.colStatus}</th>
                <th className="px-6 py-3.5">{t.organizations.colCreated}</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{t.admin.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-destructive">
                    {t.organizations.failedToLoad}
                  </td>
                </tr>
              ) : !data || data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-gray-500">
                    {t.organizations.noOrganizationsFound}
                  </td>
                </tr>
              ) : (
                data.map((org) => {
                  const isSelected = selectedRowId === org.orgId;
                  return (
                    <tr
                      key={org.orgId}
                      onClick={() => selectRow(org.orgId)}
                      className={cn(
                        "border-l-[3px] transition-all cursor-pointer",
                        isSelected ? "!bg-primary/10 border-l-primary" : "border-l-transparent hover:bg-gray-50/50"
                      )}
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">{org.orgId}</td>
                      <td className="px-6 py-4">{org.name}</td>
                      <td className="px-6 py-4 text-gray-500">{org.contactEmail || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                          {org.status || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {org.createdDate ? new Date(org.createdDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={RouteConfig.PLATFORM_ADMIN.ORGANIZATION.VIEW(org.orgId)}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          {t.organizations.manageUsers}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-100 gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{t.admin.rowsPerPage}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-transparent border-none text-gray-700 focus:ring-0 cursor-pointer font-medium outline-none text-sm"
            >
              {[25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">
              {total === 0 ? "0-0" : `${startRow}-${endRow}`} {t.admin.of} {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || total === 0}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationsListPage() {
  return (
    <Suspense>
      <OrganizationsListContent />
    </Suspense>
  );
}
