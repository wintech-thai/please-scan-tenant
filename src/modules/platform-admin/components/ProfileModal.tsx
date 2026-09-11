"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { profileApi, type AdminProfile } from "@/modules/platform-admin/api/profile.api";

type Props = { onClose: () => void };

// แปลงเบอร์ไทยแบบที่คนกรอกปกติ (0812345678) ให้เป็น E.164 ตามที่ backend บังคับ (+66812345678)
function toE164Phone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `+66${digits.slice(1)}`;
  if (digits.startsWith("66")) return `+${digits}`;
  return `+66${digits}`;
}

export default function ProfileModal({ onClose }: Props) {
  const [profile, setProfile] = useState<AdminProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // ป้องกัน race: effect นี้ถูกยิงซ้ำได้ (เช่น React StrictMode ตอน dev) และถ้า
    // response ที่มาช้ากว่ามาทับ state ทีหลัง จะเขียนทับสิ่งที่ user พิมพ์ไปแล้วหาย
    let cancelled = false;
    profileApi
      .getUserInfo()
      .then((res) => {
        if (!cancelled) setProfile(res.data?.user ?? {});
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (field: keyof AdminProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await profileApi.updateUserInfo({
        name: profile.name ?? "",
        lastName: profile.lastName ?? "",
        phoneNumber: toE164Phone(profile.phoneNumber ?? ""),
        secondaryEmail: profile.secondaryEmail ?? "",
      });
      // backend คืน HTTP 200 เสมอแม้ validation ผิด (เช่น phone format) ต้องเช็ค status เอง
      if (res.data?.status !== "SUCCESS") {
        toast.error(res.data?.description || "Failed to update profile");
        return;
      }
      toast.success("Profile updated");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Profile</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage your account information</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              <Input label="Username" value={profile.userName ?? ""} readOnly disabled />
              <Input label="Email" value={profile.userEmail ?? ""} readOnly disabled />
              <Input label="First name" value={profile.name ?? ""} onChange={set("name")} />
              <Input label="Last name" value={profile.lastName ?? ""} onChange={set("lastName")} />
              <Input
                label="Phone number"
                placeholder="0812345678"
                value={profile.phoneNumber ?? ""}
                onChange={set("phoneNumber")}
                onBlur={() => setProfile((p) => ({ ...p, phoneNumber: toE164Phone(p.phoneNumber ?? "") }))}
              />
              <Input
                label="Secondary email"
                type="email"
                value={profile.secondaryEmail ?? ""}
                onChange={set("secondaryEmail")}
              />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isPending={saving}>
                Save
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
