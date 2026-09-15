"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionItem = {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  success?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function RowActions({ items }: { items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
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
          if (!open) {
            const rect = e.currentTarget.getBoundingClientRect();
            const estimatedMenuHeight = items.length * 36 + 16;
            setOpenUpward(window.innerHeight - rect.bottom < estimatedMenuHeight);
          }
          setOpen((v) => !v);
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div
          className={cn(
            "absolute right-0 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden",
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
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
