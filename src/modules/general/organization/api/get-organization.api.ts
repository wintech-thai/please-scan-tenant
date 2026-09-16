import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";

export interface GetOrganizationResponse {
  orgId:          string;
  orgCustomId:    string;
  orgName:        string;
  orgDescription: string;
  tags:           string;
  addresses:      string;
  channels:       string;
  logoImagePath:  string;
  addressesArray: { name: string; value: string }[];
  channelsArray:  { name: string; value: string }[];
  logoImageUrl:   string;
  logoImageBase64: string | null;
  orgCreatedDate: Date;
}


export const getOrganizationApi = {
  key: "get-organization",
  useGetOrganization: (
    params: {
      orgId: string;
    }
  ) => {
    return useQuery<AxiosResponse<GetOrganizationResponse>, AxiosError>({
      queryKey: [getOrganizationApi.key, params],
      queryFn: () => {
        return api.get(`/api/Organization/org/${params.orgId}/action/GetOrganization`)
      }
    });
  }
}
