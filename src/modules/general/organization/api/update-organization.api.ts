import { api } from "@/lib/axios";
import { useErrorToast } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export interface UpdateOrganizationRequest {
  orgId:          string;
  orgCustomId:    string;
  orgName:        string;
  orgDescription: string;
  tags:           string;
  addresses:      string;
  channels:       string;
  logoImagePath:  string;
  addressesArray: SArray[];
  channelsArray:  SArray[];
  logoImageUrl:   string;
  logoImageBase64: string | null;
}

export interface SArray {
  name:  string;
  value: string;
}

export interface UpdateOrganizationResponse {
  status: string;
  description: string
}

export const updateOrganizationApi = {
  key: "update-organization",
  useUpdateOrganization: () => {
    return useMutation({
      mutationKey: [updateOrganizationApi.key],
      mutationFn: (params: { orgId: string; values: UpdateOrganizationRequest }) => {
        return api.post<UpdateOrganizationResponse>(
          `/api/Organization/org/${params.orgId}/action/UpdateOrganization`,
          params.values
        );
      },
      onError: useErrorToast()
    });
  },
};
