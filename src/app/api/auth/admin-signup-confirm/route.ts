import { apiClient } from "@/lib/axios";
import { NextResponse } from "next/server";

// Endpoint นี้ต้องเรียกได้โดยไม่ต้อง login (ผู้ใช้ยังไม่มีบัญชี ณ จุดนี้)
// เลยเรียก backend ตรง ๆ ผ่าน apiClient แทนที่จะผ่าน /api/bff ซึ่งบังคับต้องมี access_token cookie เสมอ
export async function POST(req: Request) {
  const { orgId, token, userName, email, password, firstName, lastName, orgUserId } = await req.json();

  try {
    const r = await apiClient.post(
      `/admin-api/RegistrationAdmin/org/${orgId || "global"}/action/ConfirmNewUserInvitation/${token}/${userName}`,
      {
        Email: email,
        UserName: userName,
        Password: password,
        Name: firstName,
        LastName: lastName,
        OrgUserId: orgUserId,
      }
    );
    return NextResponse.json(r.data, { status: r.status });
  } catch (err) {
    const status = (err as { response?: { status?: number; data?: unknown } })?.response?.status ?? 500;
    const data = (err as { response?: { data?: unknown } })?.response?.data ?? { status: "ERROR", description: "Request failed" };
    return NextResponse.json(data, { status });
  }
}
