import { baseApi } from "./baseApi";

export type SupportTicketStatus =
  | "open"
  | "assigned"
  | "waiting_for_support"
  | "waiting_for_customer"
  | "resolved"
  | "closed";

export type SupportCategory =
  | "technical_issue"
  | "billing_subscription"
  | "account_access"
  | "strategy_alerts"
  | "withdrawal_payment"
  | "other";

export type SupportPriority = "low" | "medium" | "high";

export type SupportTicketFormPayload = {
  subject: string;
  body: string;
  category?: SupportCategory;
  priority?: SupportPriority;
};

export type CreateSupportTicketPayload = {
  token: string;
  data: SupportTicketFormPayload;
};

export type GetSupportTicketsPayload = {
  token: string;
  page?: number;
  limit?: number;
  status?: SupportTicketStatus;
};

export type GetSupportTicketPayload = {
  token: string;
  ticketId: string;
};

export type AddSupportMessagePayload = {
  token: string;
  ticketId: string;
  body: string;
};

export type SupportMessage = {
  _id?: string;
  id?: string;
  body?: string;
  message?: string;
  senderType?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

export type SupportTicket = {
  _id?: string;
  id?: string;
  subject?: string;
  body?: string;
  status?: SupportTicketStatus | string;
  createdAt?: string;
  updatedAt?: string;
  messages?: SupportMessage[];
  [key: string]: any;
};

export type SupportTicketListResponse = {
  data?: SupportTicket[];
  items?: SupportTicket[];
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: any;
};

export type SupportTicketResponse = {
  data?: SupportTicket;
  item?: SupportTicket;
  [key: string]: any;
};

export type SupportMessagesResponse = {
  data?: SupportMessage[];
  items?: SupportMessage[];
  [key: string]: any;
};

const buildSupportBody = (data: SupportTicketFormPayload) => {
  const categoryLabel = data.category
    ? data.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Other";

  const priorityLabel = data.priority
    ? data.priority.charAt(0).toUpperCase() + data.priority.slice(1)
    : "Medium";

  return {
    subject: `[${categoryLabel}] [${priorityLabel}] ${data.subject.trim()}`,
    body: [
      `Complaint Category: ${categoryLabel}`,
      `Priority: ${priorityLabel}`,
      "",
      data.body.trim(),
    ].join("\n"),
  };
};

const extractMessagesFromTicketResponse = (
  response: SupportTicketResponse | any
): SupportMessagesResponse => {
  const ticket =
    response?.data && typeof response.data === "object"
      ? response.data
      : response?.item && typeof response.item === "object"
      ? response.item
      : response;

  const messages = Array.isArray(ticket?.messages) ? ticket.messages : [];

  return {
    data: messages,
  };
};

export const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSupportTicket: builder.mutation<
      SupportTicketResponse,
      CreateSupportTicketPayload
    >({
      query: ({ token, data }) => ({
        url: "/support/tickets",
        method: "POST",

        body: buildSupportBody(data),
      }),
    }),

    getSupportTickets: builder.query<
      SupportTicketListResponse,
      GetSupportTicketsPayload
    >({
      query: ({ token, page = 1, limit = 10, status }) => ({
        url: "/support/tickets",
        method: "GET",
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
        },
      }),
    }),

    getSupportTicket: builder.query<
      SupportTicketResponse,
      GetSupportTicketPayload
    >({
      query: ({ token, ticketId }) => ({
        url: `/support/tickets/${ticketId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    }),

    addSupportMessage: builder.mutation<any, AddSupportMessagePayload>({
      query: ({ token, ticketId, body }) => ({
        url: `/support/tickets/${ticketId}/messages`,
        method: "POST",
   
        body: {
          body: body.trim(),
        },
      }),
    }),

    // Reuses GET /support/tickets/:ticketId because you only shared that read endpoint.
    // If backend later gives a separate GET /support/tickets/:ticketId/messages, replace this.
    getSupportMessages: builder.query<
      SupportMessagesResponse,
      GetSupportTicketPayload
    >({
      query: ({ token, ticketId }) => ({
        url: `/support/tickets/${ticketId}`,
        method: "GET",
       
      }),
      transformResponse: (response: SupportTicketResponse) =>
        extractMessagesFromTicketResponse(response),
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateSupportTicketMutation,
  useGetSupportTicketsQuery,
  useGetSupportTicketQuery,
  useGetSupportMessagesQuery,
  useAddSupportMessageMutation,
} = supportApi;