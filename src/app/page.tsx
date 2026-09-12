"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RouteConfig } from "@/config/route.config";
import { isAdminRole } from "@/lib/web-role";

// ไม่มี dashboard กลางที่ "/" จริง ๆ - หลัง login แล้ว sign-in จะพาไปหน้า org ที่ถูกต้องเสมอ
// (RouteConfig.DASHBOARD.OVERVIEW(orgId) สำหรับ tenant, RouteConfig.PLATFORM_ADMIN.ORGANIZATION.LIST สำหรับ admin)
// "/" เลยแค่เด้งไปหน้า sign-in ที่ถูกต้องตาม role เท่านั้น
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAdminRole ? RouteConfig.PLATFORM_ADMIN.LOGIN : RouteConfig.LOGIN);
  }, [router]);

  return null;
}
