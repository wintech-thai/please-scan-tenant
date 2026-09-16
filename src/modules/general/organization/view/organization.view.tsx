"use client";

import { useParams } from "next/navigation";
import { getOrganizationApi } from "../api/get-organization.api";
import { OrganizationForm } from "../components/organization-form/organization-form";
import { OrganizationSchemaType } from "../schema/organization.schema";
import { updateOrganizationApi } from "../api/update-organization.api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { NoPermissionsPage } from "@/components/ui/no-permissions";

const OrganizationView = () => {
  const params = useParams<{ orgId: string }>();
  const { t } = useTranslation("organization");

  const getOrg = getOrganizationApi.useGetOrganization({
    orgId: params.orgId,
  });

  const updateOrg = updateOrganizationApi.useUpdateOrganization();

  const handleSubmit = async (data: OrganizationSchemaType) => {
    try {
      // Convert addresses and channels from record to array format for API
      const addressesArray = data.addresses
        ? Object.entries(data.addresses)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, value]) => value !== null && value !== "")
            .map(([name, value]) => ({ name, value: value as string }))
        : [];

      const channelsArray = data.channels
        ? Object.entries(data.channels)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, value]) => value !== null && value !== "")
            .map(([name, value]) => ({ name, value: value as string }))
        : [];

      // Convert to JSON string with capital Name and Value for addresses and channels fields
      const addressesJsonArray = addressesArray.map((item) => ({
        Name: item.name,
        Value: item.value,
      }));
      const channelsJsonArray = channelsArray.map((item) => ({
        Name: item.name,
        Value: item.value,
      }));

      const addresses = JSON.stringify(addressesJsonArray);
      const channels = JSON.stringify(channelsJsonArray);

      await updateOrg.mutateAsync(
        {
          orgId: params.orgId,
          values: {
            orgId: data.orgId,
            orgCustomId: data.orgCustomId,
            orgName: data.orgName,
            orgDescription: data.orgDescription,
            tags: data.tags,
            addresses,
            channels,
            logoImagePath: data.logoImagePath || "",
            logoImageUrl: data.logoImageUrl || "",
            logoImageBase64: data.logoImageBase64 || null,
            addressesArray,
            channelsArray,
          },
        },
        {
          onSuccess: ({ data }) => {
            if (data.status !== "OK") {
              return toast.error(data.description);
            }

            toast.success(t("messages.updateSuccess"));
            return getOrg.refetch();
          },
        }
      );
    } catch {
      toast.error(t("messages.updateError"));
    }
  };

  if (getOrg.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="size-4 animate-spin" />
      </div>
    );
  }

  if (getOrg.isError) {
    if (getOrg.error.response?.status === 403) {
      return <NoPermissionsPage errors={getOrg.error} />;
    }

    throw new Error(getOrg.error.message);
  }

  if (!getOrg.data?.data) {
    throw new Error("Organization Not Found");
  }

  // Parse addresses and channels from JSON strings to record format
  let addresses: Record<string, string> = {};
  let channels: Record<string, string> = {};

  try {
    if (getOrg.data.data.addresses) {
      const addressesArray = JSON.parse(getOrg.data.data.addresses);
      addresses = addressesArray.reduce(
        (
          acc: Record<string, string>,
          item: { Name: string; Value: string }
        ) => {
          acc[item.Name] = item.Value;
          return acc;
        },
        {}
      );
    }
  } catch (error) {
    console.error("Error parsing addresses:", error);
  }

  try {
    if (getOrg.data.data.channels) {
      const channelsArray = JSON.parse(getOrg.data.data.channels);
      channels = channelsArray.reduce(
        (
          acc: Record<string, string>,
          item: { Name: string; Value: string }
        ) => {
          acc[item.Name] = item.Value;
          return acc;
        },
        {}
      );
    }
  } catch (error) {
    console.error("Error parsing channels:", error);
  }

  return (
    <OrganizationForm
      key={getOrg.dataUpdatedAt}
      onSubmit={handleSubmit}
      defaultValues={{
        orgId: getOrg.data.data.orgId,
        orgCustomId: getOrg.data.data.orgCustomId,
        orgName: getOrg.data.data.orgName,
        orgDescription: getOrg.data.data.orgDescription,
        tags: getOrg.data.data.tags,
        logoImagePath: getOrg.data.data.logoImagePath,
        logoImageUrl: getOrg.data.data.logoImageUrl,
        logoImageBase64: getOrg.data.data.logoImageBase64,
        addresses,
        channels,
      }}
    />
  );
};

export default OrganizationView;
