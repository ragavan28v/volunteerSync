import { api } from "./client";

export async function getMyVolunteerProfile() {
  const res = await api.get("/api/volunteers/me");
  return res.data;
}

export async function updateMyVolunteerProfile(payload) {
  const res = await api.patch("/api/volunteers/me", payload);
  return res.data;
}

export async function listVolunteers(params) {
  const res = await api.get("/api/volunteers", { params });
  return res.data;
}

export async function getVolunteer(id) {
  const res = await api.get(`/api/volunteers/${id}`);
  return res.data;
}
