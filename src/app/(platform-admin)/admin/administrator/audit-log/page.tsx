"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { platformAdminApi } from "@/modules/platform-admin/api/platform-admin.api";
import { useRowHighlight } from "@/modules/platform-admin/hooks/use-row-highlight";
import { cn } from "@/lib/utils";
import { Search, Loader, ChevronLeft, ChevronRight, FileText } from "lucide-react";

function formatTimestamp(t?: string) {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return t;
  }
}

function AuditLogContent() {
  const { selectedRowId, selectRow } = useRowHighlight("platform_admin_audit_log_highlight");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const offset = (page - 1) * itemsPerPage;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-admin", "audit-log", search, offset, itemsPerPage],
    queryFn: async () => {
      const r = await platformAdminApi.queryAuditLogs({
        FullTextSearch: search || undefined,
        Offset: offset,
        Limit: itemsPerPage,
        ReturnDocs: true,
      });
      return r.data;
    },
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleSearchTrigger = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const startRow = total === 0 ? 0 : offset + 1;
  const endRow = Math.min(offset + itemsPerPage, total);
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Actions taken through the platform admin API</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex gap-2 max-w-sm">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
              placeholder="Search audit log"
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
            />
            <button
              onClick={handleSearchTrigger}
              className="px-4 py-2 bg-primary hover:opacity-90 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Path</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-sm text-destructive">
                    Failed to load audit log
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-500">No audit log entries found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSelected = selectedRowId === log.id;
                  return (
                  <tr
                    key={log.id}
                    onClick={() => selectRow(log.id)}
                    className={cn(
                      "border-l-[3px] transition-all cursor-pointer",
                      isSelected ? "!bg-primary/10 border-l-primary" : "border-l-transparent hover:bg-gray-50/50"
                    )}
                  >
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatTimestamp(log["@timestamp"])}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{log.user_name || "-"}</td>
                    <td className="px-6 py-4 text-gray-500">{log.action || "-"}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{log.path || "-"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          !log.status_code
                            ? "bg-gray-100 text-gray-700"
                            : log.status_code === 200
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                        )}
                      >
                        {log.status_code ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{log.client_ip || "-"}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-gray-100 gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page</span>
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
              {total === 0 ? "0-0" : `${startRow}-${endRow}`} of {total}
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

export default function AuditLogPage() {
  return (
    <Suspense>
      <AuditLogContent />
    </Suspense>
  );
}
