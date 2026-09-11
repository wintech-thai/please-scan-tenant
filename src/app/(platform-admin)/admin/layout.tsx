"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Key, LogOut, UserCog } from "lucide-react";
import { isAdminRole } from "@/lib/web-role";
import { RouteConfig } from "@/config/route.config";
import { authApi } from "@/modules/auth/api/auth.api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ProfileModal from "@/modules/platform-admin/components/ProfileModal";
import ChangePasswordModal from "@/modules/platform-admin/components/ChangePasswordModal";
import { cn } from "@/lib/utils";
import Cookies from "js-cookie";
import { LanguageProvider, useLang } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <PlatformAdminLayoutInner>{children}</PlatformAdminLayoutInner>
    </LanguageProvider>
  );
}

function PlatformAdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const isSignInPage = pathname === RouteConfig.PLATFORM_ADMIN.LOGIN;

  // ลำดับตาม Administrator section ของ Please ERP: Custom Roles, API Keys, Users, Audit Log
  const ADMINISTRATOR_ITEMS = [
    { label: t.nav.customRoles, href: RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.CUSTOM_ROLE.LIST },
    { label: t.nav.apiKeys, href: RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.API_KEY.LIST },
    { label: t.nav.users, href: RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.USER.LIST },
    { label: t.nav.auditLog, href: RouteConfig.PLATFORM_ADMIN.ADMINISTRATOR.AUDIT_LOG.LIST },
  ];

  // Cookies.get() ต้องอ่านหลัง mount เท่านั้น เพราะ SSR อ่าน cookie ของ browser ไม่ได้
  // (ถ้าอ่านตอน render ตรง ๆ จะได้ "Admin" ตอน SSR แต่ได้ค่าจริงตอน client -> hydration mismatch)
  // Hooks ต้องอยู่ก่อน early return เสมอ (Rules of Hooks) เพราะ isSignInPage เปลี่ยนได้ตอน
  // client-side navigate ระหว่างหน้า sign-in กับหน้าอื่น โดยไม่ remount component
  const [userName, setUserName] = useState("Admin");
  const [modal, setModal] = useState<"profile" | "changePassword" | null>(null);
  // ต้องเช็คทุกครั้งที่ pathname เปลี่ยน ไม่ใช่แค่ตอน mount ครั้งแรก เพราะ layout นี้ไม่ได้ remount
  // ตอน login ใหม่ด้วย user คนละคน (client-side navigate จากหน้า sign-in ไป organizations)
  // ถ้า deps ว่างเปล่า cookie เดิมที่อ่านตอน mount ครั้งแรกจะค้างอยู่จนกว่าจะ refresh หน้าเอง
  useEffect(() => {
    const name = Cookies.get("user_name");
    if (name) setUserName(name);
  }, [pathname]);

  const changeLang = (l: Lang) => setLang(l);

  // build นี้ (NEXT_PUBLIC_WEB_ROLE ไม่ใช่ ADMIN) ไม่ควรเข้าถึงส่วนนี้ได้เลย
  if (!isAdminRole) {
    return (
      <div className="h-[100dvh] flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Not available</h1>
          <p className="text-sm text-gray-500 mt-1">
            This admin section is only available on the admin deployment.
          </p>
        </div>
      </div>
    );
  }

  if (isSignInPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await authApi.logout.clearCookies();
    router.push(RouteConfig.PLATFORM_ADMIN.LOGIN);
  };

  const isOrgActive = pathname?.startsWith(RouteConfig.PLATFORM_ADMIN.ORGANIZATION.LIST);
  const isAdministratorActive = ADMINISTRATOR_ITEMS.some((item) => pathname?.startsWith(item.href));

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="border-b bg-white">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={RouteConfig.PLATFORM_ADMIN.ORGANIZATION.LIST} className="flex items-center gap-2.5 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Please Scan" className="w-8 h-8 object-contain" />
              <div className="leading-tight">
                <p className="font-bold text-sm text-gray-900">Please Scan</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href={RouteConfig.PLATFORM_ADMIN.ORGANIZATION.LIST}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium",
                  isOrgActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {t.nav.organizations}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium",
                      isAdministratorActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {t.nav.administrator}
                    <ChevronDown className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {ADMINISTRATOR_ITEMS.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(["th", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    lang === l ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase flex-shrink-0">
                    {userName.charAt(0)}
                  </div>
                  <span className="text-gray-700 font-medium">{userName}</span>
                  <ChevronDown className="size-3.5 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setModal("profile")}>
                  <UserCog className="size-4 text-gray-400" />
                  {t.nav.profile}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setModal("changePassword")}>
                  <Key className="size-4 text-gray-400" />
                  {t.nav.changePassword}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut className="size-4" />
                  {t.nav.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full px-6 py-6 flex flex-col min-h-0">{children}</main>

      {modal === "profile" && <ProfileModal onClose={() => setModal(null)} />}
      {modal === "changePassword" && <ChangePasswordModal onClose={() => setModal(null)} />}
    </div>
  );
}
