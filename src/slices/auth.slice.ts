// src/store/auth/auth.slice.ts
import { createSlice } from "@reduxjs/toolkit";
import { checkUserSession } from "./auth.thunks";

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initializing: true, // while we check /auth/me
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logoutSuccess(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkUserSession.pending, (state) => {
        state.initializing = true;
      })
      .addCase(checkUserSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.initializing = false;
      })
      .addCase(checkUserSession.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.initializing = false;
      });
  },
});

export const { loginSuccess, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
