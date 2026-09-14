import { apiClient } from "@/lib/axios";
import { isAdminRole } from "@/lib/web-role";
import { NextResponse } from "next/server";

// Endpoint นี้ต้องเรียกได้โดยไม่ต้อง login (ผู้ใช้ยังไม่ผ่าน auth ณ จุดนี้)
// เลยเรียก backend ตรง ๆ ผ่าน apiClient แทนที่จะผ่าน /api/bff ซึ่งบังคับต้องมี access_token cookie เสมอ
// path /forgot-password/{orgId}/{token} เป็น path เดียวกันทั้ง admin และ tenant (backend hardcode
// regType="forgot-password" ไว้ตายตัวไม่แยกตาม role) เลยต้องแยก endpoint ปลายทางเองตรงนี้แทน
export async function POST(req: Request) {
  const { orgId, token, userName, email, password, orgUserId } = await req.json();

  const base = isAdminRole
    ? `/admin-api/RegistrationAdmin/org/${orgId || "global"}/action`
    : `/api/Registration/org/${orgId}/action`;

  try {
    const r = await apiClient.post(`${base}/ConfirmForgotPasswordReset/${token}/${userName}`, {
      Email: email,
      UserName: userName,
      Password: password,
      OrgUserId: orgUserId,
    });
    return NextResponse.json(r.data, { status: r.status });
  } catch (err) {
    const status = (err as { response?: { status?: number; data?: unknown } })?.response?.status ?? 500;
    const data = (err as { response?: { data?: unknown } })?.response?.data ?? { status: "ERROR", description: "Request failed" };
    return NextResponse.json(data, { status });
  }
}
