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
