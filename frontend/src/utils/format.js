import dayjs from "dayjs";

export function fmtDateTime(dt) {
  if (!dt) return "";
  return dayjs(dt).format("D MMM, h:mm A");
}

export function toLocalInputValue(dt) {
  if (!dt) return "";
  return dayjs(dt).format("YYYY-MM-DDTHH:mm");
}

export function fromLocalInputValue(v) {
  if (!v) return null;
  const d = dayjs(v);
  return d.isValid() ? d.toISOString() : null;
}

export function skillsToArray(text) {
  return String(text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
}

export function fmtHours(hours) {
  const h = Number(hours || 0);
  if (!Number.isFinite(h) || h <= 0) return "0m";
  const totalMinutes = Math.max(0, Math.round(h * 60));
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  if (hh <= 0) return `${totalMinutes}m`;
  return mm ? `${hh}h ${mm}m` : `${hh}h`;
}
