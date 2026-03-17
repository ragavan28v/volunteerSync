import { api } from "./client";

export async function signup(payload) {
  const res = await api.post("/api/auth/signup", payload);
  return res.data;
}

export async function login(payload) {
  const res = await api.post("/api/auth/login", payload);
  return res.data;
}

export async function logout() {
  await api.post("/api/auth/logout");
}

export async function me() {
  const res = await api.get("/api/auth/me");
  return res.data;
}
