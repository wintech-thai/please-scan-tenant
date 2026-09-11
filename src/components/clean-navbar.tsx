"use client";

import { useLang } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import { cn } from "@/lib/utils";

type Props = { subtitle?: string };

// navbar เปล่า ๆ สำหรับหน้า public ที่ยังไม่ login (signup-confirm ทั้งฝั่ง admin/tenant)
// มีแค่ branding กับสลับภาษา ไม่มีเมนู
export function CleanNavbar({ subtitle }: Props) {
  const { lang, setLang } = useLang();
  return (
    <header className="border-b bg-white">
      <div className="w-full px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Please Scan" className="w-8 h-8 object-contain" />
          <div className="leading-tight">
            <p className="font-bold text-sm text-gray-900">Please Scan</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {(["th", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                lang === l ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
