import dayjs from "dayjs";

export function fmtDateTime(dt) {
  if (!dt) return "";
  return dayjs(dt).format("D MMM, HH:mm");
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
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
