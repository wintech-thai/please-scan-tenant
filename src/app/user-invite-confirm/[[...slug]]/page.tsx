"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, Loader2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteConfig } from "@/config/route.config";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { CleanNavbar } from "@/components/clean-navbar";

interface InviteInfo {
  userName: string;
  email: string;
  orgUserId?: string;
  invitedBy?: string;
}

function InviteConfirmContent() {
  const router = useRouter();
  const params = useParams<{ slug?: string[] }>();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const ti = t.inviteConfirm;

  const slug = params?.slug;
  const orgId = slug?.[0] || "";
  const token = slug?.[1] || "";

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [errorDecode, setErrorDecode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (!dataParam) {
      setErrorDecode(true);
      return;
    }
    const tryParse = (decode: (s: string) => string) => {
      const parsed = JSON.parse(decode(dataParam));
      setInviteInfo({
        userName: parsed.UserName || parsed.userName || "",
        email: parsed.Email || parsed.email || "",
        orgUserId: parsed.OrgUserId || parsed.orgUserId,
        invitedBy: parsed.InvitedBy || parsed.invitedBy,
      });
    };
    try {
      tryParse((s) => decodeURIComponent(escape(atob(s))));
    } catch {
      try {
        tryParse((s) => atob(s));
      } catch {
        setErrorDecode(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleAccept = async () => {
    if (!inviteInfo) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/user-invite-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          token,
          userName: inviteInfo.userName,
          email: inviteInfo.email,
          orgUserId: inviteInfo.orgUserId,
        }),
      });
      const data = await res.json();
      if (data?.status && data.status !== "OK") {
        toast.error(data.description || ti.errorMsg);
        setSubmitting(false);
        return;
      }
      toast.success(ti.successMsg);
      router.push(RouteConfig.LOGIN);
    } catch {
      toast.error(ti.errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CleanNavbar />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900">{ti.title}</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">{ti.subtitle}</p>

          {errorDecode ? (
            <div className="flex flex-col items-center py-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-red-600 font-medium text-sm">{ti.invalidLink}</p>
            </div>
          ) : !inviteInfo ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm">{ti.loading}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-gray-600 text-center">{ti.inviteMessage}</p>
              <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{ti.username}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{inviteInfo.userName || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{ti.email}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{inviteInfo.email || "-"}</p>
                  </div>
                </div>
              </div>
              {inviteInfo.invitedBy && (
                <p className="text-xs text-center text-gray-400">
                  {ti.invitedBy} <span className="font-medium text-gray-600">{inviteInfo.invitedBy}</span>
                </p>
              )}
              <Button onClick={handleAccept} isPending={submitting} className="w-full">
                <CheckCircle className="w-4 h-4" />
                {ti.acceptButton}
              </Button>
              <p className="text-xs text-gray-400 text-center">{ti.footer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserInviteConfirmPage() {
  return (
    <LanguageProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <InviteConfirmContent />
      </Suspense>
    </LanguageProvider>
  );
}
