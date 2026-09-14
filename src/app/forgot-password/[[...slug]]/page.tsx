"use client";

import { useState, useEffect, useId, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RouteConfig } from "@/config/route.config";
import { isAdminRole } from "@/lib/web-role";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import { CleanNavbar } from "@/components/clean-navbar";
import { cn } from "@/lib/utils";

interface UserInfo {
  userName: string;
  email: string;
  orgUserId?: string;
}

function ReqBullet({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <li className={cn("flex items-start gap-2 text-xs transition-colors", isValid ? "text-primary font-medium" : "text-gray-400")}>
      <span className="mt-0.5 text-[10px]">•</span>
      <span>{text}</span>
    </li>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="*:not-first:mt-2 w-full">
      <label htmlFor={id} className="text-sm leading-4 font-medium after:content-['*'] after:ml-1 after:text-red-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={15}
          className={cn(
            "h-12 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-10 text-base shadow-xs outline-none border-input",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            error && "border-destructive"
          )}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ForgotPasswordConfirmContent() {
  const router = useRouter();
  const params = useParams<{ slug?: string[] }>();
  const searchParams = useSearchParams();
  const { t } = useLang();

  const slug = params?.slug;
  const orgId = slug?.[0] || "global";
  const token = slug?.[1] || "";

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (!dataParam) return;
    const tryParse = (decode: (s: string) => string) => {
      const parsed = JSON.parse(decode(dataParam));
      setUserInfo({
        userName: parsed.UserName || parsed.userName || "",
        email: parsed.Email || parsed.email || "",
        orgUserId: parsed.OrgUserId || parsed.orgUserId,
      });
    };
    try {
      tryParse((s) => decodeURIComponent(escape(atob(s))));
    } catch {
      try {
        tryParse((s) => atob(s));
      } catch {
        toast.error(t.forgotPasswordConfirm.invalidLink);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const reqs = {
    length: password.length >= 7 && password.length <= 15,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const validate = () => {
    const fp = t.forgotPasswordConfirm;
    const errs: Record<string, string> = {};
    if (!password) errs.password = fp.errPassword;
    else if (!reqs.length || !reqs.upper || !reqs.lower || !reqs.special) errs.password = fp.errPasswordReq;
    if (!confirmPassword) errs.confirmPassword = fp.errConfirmRequired;
    else if (password !== confirmPassword) errs.confirmPassword = fp.errConfirmMismatch;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !userInfo) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          token,
          userName: userInfo.userName,
          email: userInfo.email,
          password,
          orgUserId: userInfo.orgUserId,
        }),
      });
      const data = await res.json();
      if (data?.status && data.status !== "OK") {
        toast.error(data.description || t.forgotPasswordConfirm.errorMsg);
        return;
      }
      toast.success(t.forgotPasswordConfirm.successMsg);
      router.push(isAdminRole ? RouteConfig.PLATFORM_ADMIN.LOGIN : RouteConfig.LOGIN);
    } catch {
      toast.error(t.forgotPasswordConfirm.errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const fp = t.forgotPasswordConfirm;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CleanNavbar subtitle={isAdminRole ? "Admin" : undefined} />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900">{fp.title}</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">{fp.subtitle}</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label={fp.username} value={userInfo?.userName ?? ""} readOnly disabled />
              <Input label={fp.email} value={userInfo?.email ?? ""} readOnly disabled />
            </div>

            <div className="border-t border-gray-100" />

            <PasswordField
              label={fp.newPassword}
              value={password}
              onChange={(v) => {
                setPassword(v);
                setErrors((p) => ({ ...p, password: "" }));
              }}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              autoComplete="new-password"
              error={errors.password}
            />
            <PasswordField
              label={fp.confirmPassword}
              value={confirmPassword}
              onChange={(v) => {
                setConfirmPassword(v);
                setErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
              autoComplete="new-password"
              error={errors.confirmPassword}
            />

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
              <p className="text-xs font-semibold text-primary mb-2">{fp.reqTitle}</p>
              <ul className="space-y-1">
                <ReqBullet isValid={reqs.length} text={fp.req1} />
                <ReqBullet isValid={reqs.upper} text={fp.req2} />
                <ReqBullet isValid={reqs.lower} text={fp.req3} />
                <ReqBullet isValid={reqs.special} text={fp.req4} />
              </ul>
            </div>

            <Button type="submit" isPending={submitting} className="w-full">
              {fp.submit}
            </Button>
            <p className="text-xs text-gray-400 text-center">{fp.footer}</p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordConfirmPage() {
  return (
    <LanguageProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <ForgotPasswordConfirmContent />
      </Suspense>
    </LanguageProvider>
  );
}
