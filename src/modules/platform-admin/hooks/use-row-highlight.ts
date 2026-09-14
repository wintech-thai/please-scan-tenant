"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Persist "last highlighted row" per list page - mirrors Please ERP console's pattern:
// a `?highlight=<id>` query param (set when navigating back from create/update) wins on
// first load and is then cleaned from the URL; sessionStorage keeps it across reloads/tab
// revisits after that.
export function useRowHighlight(storageKey: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const highlightParam = searchParams.get("highlight");

  const [selectedRowId, setSelectedRowId] = useState<string | null>(highlightParam);

  useEffect(() => {
    if (highlightParam) {
      setSelectedRowId(highlightParam);
      sessionStorage.setItem(storageKey, highlightParam);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("highlight");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    } else {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) setSelectedRowId(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectRow = (id: string) => {
    setSelectedRowId(id);
    sessionStorage.setItem(storageKey, id);
  };

  return { selectedRowId, selectRow };
}
