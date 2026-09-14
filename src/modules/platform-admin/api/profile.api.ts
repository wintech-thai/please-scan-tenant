import { api } from "@/lib/axios";

const BASE = "/admin-api/OnlyAdmin/org/global/action";

export type AdminProfile = {
  userName?: string;
  userEmail?: string;
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  secondaryEmail?: string;
};

export type UpdateProfilePayload = {
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  secondaryEmail?: string;
};

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

// Response wrapper: { status, description, user: AdminProfile } - identity มาจาก JWT
// เลยไม่ต้องส่ง userId/userName เอง (แก้ได้แค่ของตัวเองเท่านั้น)
type MVUser = { status?: string; description?: string; user?: AdminProfile };

// backend คืน HTTP 200 เสมอแม้ logic จะ error (เช่น phone/password ผิดฟอร์แมต, current password ผิด)
// ต้องเช็ค status field เอง ห้ามอนุมานความสำเร็จจาก HTTP status อย่างเดียว
type MVResult = { status?: string; description?: string };

export const profileApi = {
  getUserInfo: () => api.get<MVUser>(`${BASE}/GetUserInfo`),

  updateUserInfo: (payload: UpdateProfilePayload) => api.post<MVResult>(`${BASE}/UpdateUserInfo`, payload),

  updatePassword: (payload: UpdatePasswordPayload) => api.post<MVResult>(`${BASE}/UpdatePassword`, payload),
};
