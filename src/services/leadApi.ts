import { baseApi } from "./baseApi";

export type LeadStatus =
  | "pending"
  | "assigned"
  | "interested"
  | "not_interested"
  | "converted";

export type LeadFormPayload = {
  name: string;
  phone: string;
  email?: string;
  interest?: string;
  message?: string;
  address?: string;
  status?: LeadStatus;
};

export type RegisterLeadPayload = {
  organization: string;
  apiSecret: string;
  data: LeadFormPayload;
};

export type CreateLeadPayload = {
  token: string;
  data: LeadFormPayload;
};

export type LeadResponse = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  source?: string;
  organization?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

const CRM_BASE_URL = "https://tradebro.io/api";

const buildLeadBody = (data: LeadFormPayload) => {
  const mergedAddress = [
    data.address?.trim(),
    data.interest?.trim() ? `Interest: ${data.interest.trim()}` : "",
    data.message?.trim() ? `Message: ${data.message.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    name: data.name.trim(),
    email: data.email?.trim() || "",
    phone: data.phone.trim(),
    address: mergedAddress || "Website Lead",
    status: data.status || "pending",
  };
};

export const leadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public website lead capture
    registerLead: builder.mutation<LeadResponse, RegisterLeadPayload>({
      query: ({ organization, apiSecret, data }) => ({
        url: `${CRM_BASE_URL}/leads/register`,
        method: "POST",
        headers: {
          "x-api-secret": apiSecret,
          "Content-Type": "application/json",
        },
        body: {
          ...buildLeadBody(data),
          organization,
        },
      }),
    }),

    // Admin / executive protected lead create
    createLead: builder.mutation<LeadResponse, CreateLeadPayload>({
      query: ({ token, data }) => ({
        url: `${CRM_BASE_URL}/leads`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: buildLeadBody(data),
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useRegisterLeadMutation,
  useCreateLeadMutation,
} = leadApi;