"use client";

import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useOrganizationSchema, OrganizationSchemaType } from "../../schema/organization.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { OrganizationDetailForm } from "./organization-detail.form";
import { OrganizationAddressesForm } from "./organization-addresses.form";
import { OrganizationChannelsForm } from "./organization-channels.form";
import { useConfirm } from "@/hooks/use-confirm";
import { useEffect, useState } from "react";
import { useFormNavigationBlocker } from "@/hooks/use-form-navigation-blocker";

interface OrganizationFormProps {
  onSubmit: (data: OrganizationSchemaType) => Promise<void>;
  defaultValues?: Partial<OrganizationSchemaType>;
}

export const OrganizationForm = ({
  onSubmit,
  defaultValues,
}: OrganizationFormProps) => {
  const { t } = useTranslation("organization");
  const [isViewMode, setIsViewMode] = useState(true);
  const { setFormDirty } = useFormNavigationBlocker();

  const schema = useOrganizationSchema();

  const form = useForm<OrganizationSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });

  const [ConfirmCancel, confirmCancel] = useConfirm({
    message: t("form.unsavedChanges"),
    title: t("form.cancelEdit"),
    variant: "destructive"
  });

  const isDirty = form.formState.isDirty;
  const isSubmitting = form.formState.isSubmitting;

  // Sync form dirty state with navigation blocker
  useEffect(() => {
    setFormDirty(isDirty);
  }, [isDirty, setFormDirty]);

  const handleEdit = () => {
    setIsViewMode(false);
  };

  const handleCancel = async () => {
    if (!isDirty) {
      setIsViewMode(true);
      return;
    }

    const ok = await confirmCancel();

    if (ok) {
      form.reset(defaultValues);
      form.clearErrors();
      setIsViewMode(true);
      setFormDirty(false);
    }
  };

  const handleSubmit = async (data: OrganizationSchemaType) => {
    // Check if logo is missing
    if (!data.logoImageBase64 && !data.logoImageUrl) {
      // Trigger the logo file picker by dispatching a custom event
      window.dispatchEvent(new CustomEvent('openUploadLogoModal'));
      return;
    }

    if (!isDirty) {
      setIsViewMode(true);
      return;
    }

    await onSubmit(data);

    form.reset();
    form.clearErrors();
    setIsViewMode(true);
    setFormDirty(false);
  };

  return (
    <FormProvider {...form}>
      <div className="h-full flex flex-col">
        <ConfirmCancel />

        <form
          className="h-full flex flex-col"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <header className="p-4 border border-b">
            <h1 className="text-lg font-bold">
              {t("title")}
            </h1>
          </header>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <OrganizationDetailForm isViewMode={isViewMode} />

            <OrganizationAddressesForm isViewMode={isViewMode} />

            <OrganizationChannelsForm isViewMode={isViewMode} />
          </div>

          <div className="border-t py-2 px-4 shrink-0 flex items-center justify-between gap-x-2">
            {/* Left side - Edit button */}
            <Button
              onClick={handleEdit}
              disabled={!isViewMode || isSubmitting}
              type="button"
            >
              {t("actions.edit")}
            </Button>

            {/* Right side - Cancel and Save buttons */}
            <div className="flex gap-x-2">
              <Button
                onClick={handleCancel}
                disabled={isViewMode || isSubmitting}
                variant="destructive"
                type="button"
              >
                {t("actions.cancel")}
              </Button>
              <Button
                isPending={isSubmitting}
                disabled={isViewMode}
              >
                {t("actions.save")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};
