// src/store/auth/auth.thunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "./api"; // make sure this points to the axios above

export const checkUserSession = createAsyncThunk(
  "auth/checkUserSession",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/me");  // cookies go automatically
      return res.data;                        // e.g. { user: { ... } }
    } catch (err: any) {
      return rejectWithValue(
        err?.response?.data || { message: "Unauthorized" }
      );
    }
  },
);



