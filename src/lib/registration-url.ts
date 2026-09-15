// backend สร้าง registration link โดยใช้ domain ของ register service (หรือ placeholder <REGISTER_SERVICE_DOMAIN>)
// ไม่ใช่ domain ของหน้านี้ ต้องแทนที่ host ให้เป็นของหน้าปัจจุบันก่อนเอาไปโชว์/copy ให้ user
// ported จาก please-erp-console's processRegistrationUrl เพื่อให้ behavior เหมือนกันทุกจุด
export function processRegistrationUrl(url: string): string {
  if (!url) return url;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (apiUrl && url.startsWith(apiUrl)) {
    return window.location.origin + url.slice(apiUrl.length);
  }
  try {
    const parsed = new URL(url);
    const current = new URL(window.location.href);
    if (parsed.host !== current.host) {
      parsed.host = current.host;
      parsed.protocol = current.protocol;
      return parsed.toString();
    }
    return url;
  } catch {
    // URL มี domain ที่ invalid/placeholder (เช่น <REGISTER_SERVICE_DOMAIN>)
    // ดึงแค่ path+query แล้วต่อกับ origin ปัจจุบันแทน
    const pathMatch = url.match(/^https?:\/\/[^/]+(\/.*)?$/);
    if (pathMatch) return window.location.origin + (pathMatch[1] ?? "");
  }
  return url;
}

// ลิงก์ที่ generate จากฝั่ง Admin console (เช่น reset password link, invite link ที่ไม่ส่งอีเมล)
// สำหรับ Organization user ไม่ควรชี้ไปที่ domain ของ admin console (admin-dev...) เพราะ org user
// ไม่ได้ login เข้า admin console เลย - ต้องชี้ไปที่ domain ของ tenant console (tenant-dev...) แทน
// ใช้ convention เดียวกับ src/lib/web-role.ts ที่ตัดสินจาก "admin"/"tenant" ใน hostname
export function toTenantUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.replace(/\badmin\b/, "tenant");
    return parsed.toString();
  } catch {
    return url;
  }
}
