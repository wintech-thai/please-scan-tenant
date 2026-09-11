import { api } from "@/lib/axios";
import { LoginSchemaType } from "../schema/login.schema";
import { LoginResponse } from "../types/auth.types";
import axios from "axios";

export const authApi = {
  login: (data: LoginSchemaType) => {
    return axios.post<LoginResponse>("/api/auth/login", data);
  },
  // Platform admin (AdminUsers table) - คนละ backend endpoint จาก org user login
  adminLogin: (data: LoginSchemaType) => {
    return axios.post<LoginResponse>("/api/auth/admin-login", data);
  },
  logout: {
    keys: "logout",
    api: (orgId: string) =>
      api.post(`/api/OnlyUser/org/${orgId}/action/Logout`),
    clearCookies: () => axios.post("/api/auth/logout"),
    clearAccessToken: () => axios.post("/api/auth/clear-access-token"),
  },
  updatePassword: {
    keys: "update-password",
    api: ({
      orgId,
      data,
    }: {
      orgId: string;
      data: { currentPassword: string; newPassword: string };
    }) =>
      api.post<{ status: string; description: string }>(
        `/api/OnlyUser/org/${orgId}/action/UpdatePassword`,
        data
      ),
  },
  forgotPassword: (email: string) => {
    return axios.post<{ status: string, description: string }>(`/api/auth/forgot-password`, { email });
  }
};
