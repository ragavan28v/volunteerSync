export function getApiBaseUrl() {
  const envBaseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  const defaultBaseURL =
    typeof window !== "undefined" &&
    window.location &&
    typeof window.location.hostname === "string" &&
    !["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "https://volunteersync.onrender.com"
      : "http://localhost:5000";

  return String(envBaseURL || defaultBaseURL).replace(/\/$/, "");
}