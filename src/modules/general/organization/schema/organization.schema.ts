import z from "zod";
import { useTranslation } from "react-i18next";

export const useOrganizationSchema = () => {
  const { t } = useTranslation("organization");

  return z.object({
    orgId: z.string().min(1, t("validation.orgIdRequired")),
    orgCustomId: z.string().min(1, t("validation.orgCustomIdRequired")),
    orgName: z.string().min(1, t("validation.orgNameRequired")),
    orgDescription: z.string().min(1, t("validation.orgDescriptionRequired")),
    tags: z.string().min(1, t("validation.tagsRequired")),
    logoImagePath: z.string().optional(),
    logoImageUrl: z.string().optional(),
    logoImageBase64: z.string().nullable().optional(),
    addresses: z.record(z.string(), z.string().nullable()).optional(),
    channels: z.record(z.string(), z.string().nullable()).optional(),
    addressesArray: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).optional(),
    channelsArray: z.array(z.object({
      name: z.string(),
      value: z.string()
    })).optional(),
  });
};

export type OrganizationSchemaType = z.infer<ReturnType<typeof useOrganizationSchema>>;
