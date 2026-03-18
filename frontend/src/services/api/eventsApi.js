import { api } from "./client";

export async function listEvents(params) {
  const res = await api.get("/api/events", { params });
  return res.data;
}

export async function getEvent(id) {
  const res = await api.get(`/api/events/${id}`);
  return res.data;
}

export async function createEvent(payload) {
  const res = await api.post("/api/events", payload);
  return res.data;
}

export async function updateEvent(id, payload) {
  const res = await api.patch(`/api/events/${id}`, payload);
  return res.data;
}

export async function deleteEvent(id) {
  await api.delete(`/api/events/${id}`);
}

export async function suggestVolunteers(eventId, payload) {
  const res = await api.post(`/api/events/${eventId}/suggest`, payload);
  return res.data;
}

export async function recommendedEvents() {
  const res = await api.get("/api/events/recommended");
  return res.data;
}

export async function interestInEvent(eventId) {
  const res = await api.post(`/api/events/${eventId}/interest`);
  return res.data;
}

export async function raiseQuery(eventId, payload) {
  const res = await api.post(`/api/events/${eventId}/query`, payload);
  return res.data;
}

export async function autoFillEvent(eventId, payload) {
  const res = await api.post(`/api/events/${eventId}/auto-fill`, payload || {});
  return res.data;
}
