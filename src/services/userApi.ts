import { baseApi } from "./baseApi";

// ----------------------
// Types
// ----------------------
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface GooglePayload {
  id_token: string;
}

export interface LoginResponse {
  message: string;
  user?: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

// ----------------------
// userApi Service
// ----------------------
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ---------------- LOGIN ----------------
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // ---------------- REGISTER ----------------
    register: builder.mutation<LoginResponse, RegisterPayload>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // ---------------- GOOGLE LOGIN ----------------
    googleLogin: builder.mutation<LoginResponse, GooglePayload>({
      query: (body) => ({
        url: "/auth/google",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // ---------------- REFRESH TOKEN ----------------
    refreshToken: builder.mutation<
      { access: string; refresh: string },
      { refreshToken: string }
    >({
      query: (body) => ({
        url: "/auth/refresh",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // ---------------- LOGOUT ----------------
    revokeToken: builder.mutation<{ message: string }, { refreshToken: string }>({
      query: (body) => ({
        url: "/auth/revoke",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

// export hooks
export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useRefreshTokenMutation,
  useRevokeTokenMutation,
} = userApi;
