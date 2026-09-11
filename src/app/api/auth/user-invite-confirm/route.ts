import { apiClient } from "@/lib/axios";
import { NextResponse } from "next/server";

// เหมือน user-signup-confirm/route.ts: user ที่ถูกเชิญ "มีบัญชีอยู่แล้ว" (username/email ตรงกับ
// user เดิมในระบบ) เลยแค่กดยืนยันเข้าร่วม org ไม่ต้องตั้ง password ใหม่ - เรียกตรงไม่ผ่าน /api/bff
// เพราะยังไม่ login
export async function POST(req: Request) {
  const { orgId, token, userName, email, orgUserId } = await req.json();

  try {
    const r = await apiClient.post(
      `/api/Registration/org/${orgId}/action/ConfirmExistingUserInvitation/${token}/${userName}`,
      {
        Email: email,
        UserName: userName,
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
