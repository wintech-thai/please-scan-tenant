"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, Users, Trash2, Ban, CheckCircle, MoreHorizontal, Loader, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { platformAdminApi } from "@/modules/platform-admin/api/platform-admin.api";
import type { AdministratorItem } from "@/modules/platform-admin/types/platform-admin.types";
import { RouteConfig } from "@/config/route.config";
import { useRowHighlight } from "@/modules/platform-admin/hooks/use-row-highlight";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LanguageContext";

function isUserActive(status?: string | null): boolean {
  return (status || "").toLowerCase() === "active";
}

function parseCsv(value?: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function AdministratorUsersListContent() {
  const { t } = useLang();
  const queryClient = useQueryClient();
  const { selectedRowId, selectRow } = useRowHighlight("platform_admin_users_highlight");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const offset = (page - 1) * itemsPerPage;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["platform-admin", "administrators", appliedSearch, offset, itemsPerPage],
    queryFn: async () => {
      const r = await platformAdminApi.getAdministrators({
        FullTextSearch: appliedSearch || undefined,
        Offset: offset,
        Limit: itemsPerPage,
      });
      return r.data ?? [];
    },
  });

  const { data: total = 0 } = useQuery({
    queryKey: ["platform-admin", "administrators-count", appliedSearch],
    queryFn: async () => {
      const r = await platformAdminApi.getAdministratorCount({ FullTextSearch: appliedSearch || undefined });
      return r.data ?? 0;
    },
  });

  const handleSearchTrigger = () => {
    setAppliedSearch(searchTerm);
    setPage(1);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["platform-admin", "administrators"] });
    queryClient.invalidateQueries({ queryKey: ["platform-admin", "administrators-count"] });
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      for (const id of selectedIds) {
        await platformAdminApi.deleteAdministratorById(id);
      }
      toast.success(selectedIds.length > 1 ? t.users.deletedBulk.replace("{count}", String(selectedIds.length)) : t.users.deletedSingle);
      setSelectedIds([]);
      setDeleteModal(false);
      invalidate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.users.failedToDelete);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (u: AdministratorItem) => {
    if (!u.adminUserId) return;
    const active = isUserActive(u.userStatus);
    const name = u.userName || u.adminUserId.slice(0, 8);
    try {
      if (active) {
        await platformAdminApi.disableAdministrator(u.adminUserId);
        toast.success(`"${name}" ${t.users.disabledSuccess}`);
      } else {
        await platformAdminApi.enableAdministrator(u.adminUserId);
        toast.success(`"${name}" ${t.users.enabledSuccess}`);
      }
      invalidate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t.users.failedToUpdateStatus);
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? users.map((u) => u.adminUserId!).filter(Boolean) : []);
  };
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const startRow = total === 0 ? 0 : offset + 1;
  const endRow = Math.min(offset + itemsPerPage, total);
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.users.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.users.subtitle}</p>
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
              placeholder={t.users.searchPlaceholder}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 sm:min-w-[220px]"
            />
            <button
              onClick={handleSearchTrigger}
              className="px-4 py-2 bg-primary hover:opacity-90 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button asChild>
              <Link href={RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.USER.CREATE}>{t.users.addUser}</Link>
            </Button>
            <button
              onClick={() => setDeleteModal(true)}
              disabled={selectedIds.length === 0}
              className="px-5 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.admin.delete}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100">
                <th className="w-12 px-6 py-3.5">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                  />
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.users.colUsername}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.users.colEmail}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.users.colTags}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.users.colCustomRole}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.users.colRoles}</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.users.colInitialUser}</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.users.colStatus}</th>
                <th className="w-14 px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.users.colAction}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{t.admin.loading}</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-500">{t.users.noUsersFound}</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelected = selectedRowId === u.adminUserId;
                  const isOwner = (u.roles ?? parseCsv(u.rolesList)).includes("OWNER");
                  const tagList = parseCsv(u.tags);
                  const roleList = u.roles?.length ? u.roles : parseCsv(u.rolesList);
                  const isInitial = u.isOrgInitialUser === "YES";
                  return (
                    <tr
                      key={u.adminUserId}
                      onClick={() => u.adminUserId && selectRow(u.adminUserId)}
                      className={cn(
                        "border-l-[3px] transition-all cursor-pointer",
                        isSelected ? "!bg-primary/10 border-l-primary" : "border-l-transparent hover:bg-gray-50/50"
                      )}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!u.adminUserId && selectedIds.includes(u.adminUserId)}
                          onChange={() => u.adminUserId && toggleOne(u.adminUserId)}
                          className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`${RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.USER.LIST}/${u.adminUserId}/update`}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "text-sm font-semibold hover:underline",
                              isSelected ? "text-primary" : "text-gray-900 hover:text-primary"
                            )}
                          >
                            {u.userName}
                          </Link>
                          {isOwner && (
                            <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded font-medium">Owner</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{u.userEmail || u.tmpUserEmail || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {tagList.length ? (
                            tagList.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.customRoleName || "-"}</td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-center">
                        {isInitial ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-sm font-medium",
                          isUserActive(u.userStatus)
                            ? "text-emerald-600"
                            : (u.userStatus || "").toLowerCase() === "pending"
                              ? "text-orange-500"
                              : "text-gray-400"
                        )}>
                          {isUserActive(u.userStatus)
                            ? t.users.active
                            : (u.userStatus || "").toLowerCase() === "pending"
                              ? t.users.pending
                              : u.userStatus || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          items={[
                            {
                              label: t.users.disableUser,
                              icon: <Ban className="w-4 h-4" />,
                              disabled: !isUserActive(u.userStatus),
                              danger: true,
                              onClick: () => handleToggleActive(u),
                            },
                            {
                              label: t.users.enableUser,
                              icon: <CheckCircle className="w-4 h-4" />,
                              disabled: isUserActive(u.userStatus),
                              success: true,
                              onClick: () => handleToggleActive(u),
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

      {deleteModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteModal(false)}
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {selectedIds.length > 1 ? t.users.deleteBulkTitle.replace("{count}", String(selectedIds.length)) : t.users.deleteUserTitle}
              </h3>
              <p className="text-sm text-gray-500">{t.users.deleteDesc}</p>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button
                onClick={() => setDeleteModal(false)}
                className="flex-1 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.admin.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {deleting ? t.users.deleting : t.admin.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdministratorUsersListPage() {
  return (
    <Suspense>
      <AdministratorUsersListContent />
    </Suspense>
  );
}

type ActionItem = { label: string; icon: React.ReactNode; danger?: boolean; success?: boolean; disabled?: boolean; onClick: () => void };

function RowActions({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-center">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setOpen(false);
                }
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors",
                item.disabled
                  ? "text-gray-300 cursor-not-allowed"
                  : item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : item.success
                      ? "text-emerald-600 hover:bg-emerald-50"
                      : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
