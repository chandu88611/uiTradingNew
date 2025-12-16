// src/api/index.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "https://backend.globalalgotrading.com",
  withCredentials: true, // 🔐 important for cookies
});
