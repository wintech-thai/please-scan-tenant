// เหมือน pattern ที่ใช้ใน please-erp-console: repo เดียวกัน build 2 รอบด้วยคนละ
// NEXT_PUBLIC_WEB_ROLE (ADMIN/TENANT) ได้ 2 Docker image แยกกัน deploy เป็นคนละ service
// hostname เป็นตัวตัดสินหลักตอน production/staging, env var เป็น fallback ตอน localhost
function detectWebRole(): "ADMIN" | "TENANT" {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("admin")) return "ADMIN";
    if (hostname.includes("tenant")) return "TENANT";
    return (process.env.NEXT_PUBLIC_WEB_ROLE as "ADMIN" | "TENANT") || "TENANT";
  }
  return (process.env.NEXT_PUBLIC_WEB_ROLE as "ADMIN" | "TENANT") || "TENANT";
}

export const WEB_ROLE = detectWebRole();
export const isAdminRole = WEB_ROLE === "ADMIN";
