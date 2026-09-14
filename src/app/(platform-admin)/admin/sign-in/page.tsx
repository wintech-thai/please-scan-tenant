"use client";

import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "@/modules/auth/components/auth-layout";
import { Controller, useForm } from "react-hook-form";
import { loginSchema, LoginSchemaType } from "@/modules/auth/schema/login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { authApi } from "@/modules/auth/api/auth.api";
import { toast } from "sonner";
import { RouteConfig } from "@/config/route.config";

export default function AdminSignInPage() {
  const router = useRouter();
  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { UserName: "", Password: "" },
    mode: "all",
  });
  const errors = form.formState.errors;

  const handleLogin = async (data: LoginSchemaType) => {
    try {
      const r = await authApi.adminLogin(data);
      if (r.status !== 200) {
        toast.error("Invalid username or password");
        return;
      }
      toast.success("Login successful");
      router.push(RouteConfig.PLATFORM_ADMIN.ORGANIZATION.LIST);
    } catch {
      toast.error("Invalid username or password");
    }
  };

  return (
    <AuthLayout
      header={
        <span className="inline-flex items-center gap-2">
          Admin sign in
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            <ShieldCheck className="size-3" />
            Admin
          </span>
        </span>
      }
    >
      <form
        className="flex flex-col space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(handleLogin)(e);
        }}
      >
        <Controller
          control={form.control}
          name="UserName"
          render={({ field }) => (
            <Input
              maxLength={30}
              placeholder="Username"
              label="Username"
              {...field}
              errorMessage={errors.UserName?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="Password"
          render={({ field }) => (
            <Input
              type="password"
              maxLength={30}
              placeholder="Password"
              label="Password"
              {...field}
              errorMessage={errors.Password?.message}
            />
          )}
        />
        <Button type="submit" isPending={form.formState.isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
