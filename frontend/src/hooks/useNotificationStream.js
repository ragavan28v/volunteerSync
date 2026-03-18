import React from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";

export function useNotificationStream() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  React.useEffect(() => {
    if (!token) return;

    const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
    const url = `${base}/api/notifications/stream?accessToken=${encodeURIComponent(token)}`;

    const es = new EventSource(url);

    function onNotification(e) {
      try {
        const data = JSON.parse(e.data);
        if (data?.message) push({ message: data.message, tone: "info" });
      } catch (err) {
        // ignore
      }
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }

    function onUnread() {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }

    es.addEventListener("notification", onNotification);
    es.addEventListener("unread", onUnread);

    es.onerror = () => {
      // allow automatic reconnect
    };

    return () => {
      es.close();
    };
  }, [token, qc, push]);
}