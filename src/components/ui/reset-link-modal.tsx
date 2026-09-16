"use client";

import { useState } from "react";
import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LanguageContext";

export function ResetLinkModal({ link, loading, onClose }: { link?: string; loading?: boolean; onClose: () => void }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-7 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{t.users.resetLinkTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t.users.resetLinkSubtitle}</p>
        </div>
        <div className="px-7 py-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">{t.users.generatingLink}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <span className="flex-1 text-sm text-primary break-all line-clamp-2 font-mono">{link}</span>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    copied ? "bg-emerald-100 text-emerald-700" : "bg-white border border-primary/20 text-primary hover:bg-primary/10"
                  )}
                >
                  {copied ? t.users.copied : t.users.copy}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">{t.users.resetLinkExpiry}</p>
            </>
          )}
        </div>
        <div className="flex justify-end px-7 pb-5">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 transition-colors">
            {t.users.close}
          </button>
        </div>
      </div>
    </div>
  );
}
