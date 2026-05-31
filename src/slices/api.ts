// src/api/index.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "https://backend.tradebro.io",
  withCredentials: true, // 🔐 important for cookies
});
