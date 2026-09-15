"use client";

import { useEffect, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { InputTags } from "@/components/ui/input-tags";

import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { OrganizationSchemaType } from "../../schema/organization.schema";
import { errorMessageAsLangKey } from "@/lib/utils";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB, same as Please ERP
const MAX_DIMENSION = 512;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

interface OrganizationDetailFormProps {
  isViewMode: boolean;
}

export const OrganizationDetailForm = ({
  isViewMode,
}: OrganizationDetailFormProps) => {
  const { t } = useTranslation("organization");
  const form = useFormContext<OrganizationSchemaType>();
  const isSubmitting = form.formState.isSubmitting;
  const logoImageBase64 = form.watch("logoImageBase64");
  const logoImageUrl = form.watch("logoImageUrl");
  const logoSrc = logoImageBase64 || logoImageUrl;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for the "logo is required before save" prompt from the parent form
  useEffect(() => {
    const handleOpenModal = () => {
      fileInputRef.current?.click();
    };

    window.addEventListener('openUploadLogoModal', handleOpenModal);
    return () => {
      window.removeEventListener('openUploadLogoModal', handleOpenModal);
    };
  }, []);

  const processLogoFile = async (file: File) => {
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error(t("logo.onlyPNG"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("logo.maxSize"));
      return;
    }

    const dataUrl = await readFileAsBase64(file);
    const { width, height } = await getImageDimensions(dataUrl);
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      toast.error(t("logo.recommendedSize"));
      return;
    }

    form.setValue("logoImageBase64", dataUrl, { shouldDirty: true });
    // New upload replaces any legacy GCS-hosted logo
    form.setValue("logoImagePath", "", { shouldDirty: true });
    form.setValue("logoImageUrl", "", { shouldDirty: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    form.setValue("logoImageBase64", null, { shouldDirty: true });
    form.setValue("logoImagePath", "", { shouldDirty: true });
    form.setValue("logoImageUrl", "", { shouldDirty: true });
  };

  return (
    <div className="p-4 md:p-6 border rounded-lg">
      <header className="text-lg font-bold mb-4">{t("detail.title")}</header>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left side - Form fields */}
        <div className="flex-1 space-y-4">
          <Input
            label={t("detail.orgCustomId")}
            isRequired
            id="orgCustomId"
            {...form.register("orgCustomId")}
            disabled={true}
            errorMessage={form.formState.errors.orgCustomId?.message}
          />

          <Input
            label={t("detail.orgName")}
            isRequired
            id="orgName"
            {...form.register("orgName")}
            disabled={isViewMode || isSubmitting}
            errorMessage={form.formState.errors.orgName?.message}
            max={30}
          />
          <Input
            label={t("detail.orgDescription")}
            isRequired
            id="orgDescription"
            {...form.register("orgDescription")}
            disabled={isViewMode || isSubmitting}
            errorMessage={form.formState.errors.orgDescription?.message}
            max={200}
          />
        </div>

        {/* Right side - Logo image */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-full max-w-xs">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt="Organization Logo"
                className="w-full h-[200px] rounded-lg border object-contain"
              />
            ) : (
              <div className="w-full h-[200px] aspect-square bg-muted rounded-lg border flex items-center justify-center text-muted-foreground">
                {t("detail.noLogo")}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isViewMode || isSubmitting}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {t("logo.upload")}
            </Button>
            {logoSrc && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveLogo}
                disabled={isViewMode || isSubmitting}
                className="gap-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Full width fields */}
      <div className="space-y-4 mt-4">
        <Controller
          control={form.control}
          name="tags"
          render={({ field }) => (
            <InputTags
              label={t("detail.tags")}
              placeholder={t("detail.tagsPlaceholder")}
              errorMessage={errorMessageAsLangKey(
                form.formState.errors.tags?.message,
                t
              )}
              maxLength={30}
              disabled={isViewMode || isSubmitting}
              isRequired
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                form.trigger("tags");
              }}
              onValidate={() => form.trigger("tags")}
            />
          )}
        />
      </div>
    </div>
  );
};
