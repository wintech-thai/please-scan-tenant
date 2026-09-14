/* eslint-disable  @typescript-eslint/no-explicit-any */
import { apiClient } from "@/lib/axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { COOKIE_NAMES, COOKIE_OPTIONS, TOKEN_EXPIRY } from "@/config/auth.config";

// Login แยกสำหรับ platform admin (บัญชีใน table AdminUsers) - ใช้คนละ backend endpoint
// กับ /api/auth/login ของ org user แต่ใช้ cookie ชื่อเดียวกัน (access_token/refresh_token/user_name)
// เพื่อให้ BFF proxy + refresh interceptor ที่มีอยู่แล้วใช้งานร่วมกันได้เลย
export async function POST(req: Request) {
  const body = await req.json();
  const cookiesStore = await cookies();

  const r = await apiClient.post("/admin-api/AuthAdmin/org/global/action/Login", body);

  if (r.status !== 200) {
    return NextResponse.json({
      success: false,
      message: r.data,
    });
  }

  const accessToken = r.data.token.access_token;
  const refreshToken = r.data.token.refresh_token;
  const expiresIn = r.data.token.expires_in; // in seconds
  const decodedToken = jwt.decode(accessToken) as { [key: string]: any } | null;
  const now = Date.now();

  cookiesStore.set({
    name: COOKIE_NAMES.USER_NAME,
    value: decodedToken?.preferred_username,
    httpOnly: false,
    maxAge: 365 * 24 * 60 * 60,
  });

  cookiesStore.set({
    name: COOKIE_NAMES.ACCESS_TOKEN,
    value: accessToken,
    ...COOKIE_OPTIONS,
    expires: new Date(now + expiresIn * 1000),
  });

  cookiesStore.set({
    name: COOKIE_NAMES.REFRESH_TOKEN,
    value: String(refreshToken),
    ...COOKIE_OPTIONS,
    maxAge: TOKEN_EXPIRY.REFRESH_TOKEN_SECONDS,
  });

  return NextResponse.json({
    success: true,
    message: "success",
  });
}
