"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function usePollingResource<T>(url: string, intervalMs = 5000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<number | null>(null);
  const blocked = useRef(false);
  const active = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (blocked.current || active.current) return;
    const controller = new AbortController();
    active.current = controller;
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      const body = await response.json();
      if (!response.ok) {
        if (!controller.signal.aborted) {
          setStatus(response.status);
          if (response.status === 401 || response.status === 403) {
            blocked.current = true;
            setData(null);
            setError("");
            return;
          }
        }
        throw new Error(body.error ?? "LabLink could not load this information.");
      }
      if (!controller.signal.aborted) { setData(body as T); setError(""); setStatus(response.status); }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not reach LabLink.");
    } finally {
      if (active.current === controller) active.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    const sync = () => { if (document.visibilityState === "visible") void refresh(); };
    const initial = window.setTimeout(sync, 0);
    const timer = window.setInterval(sync, intervalMs);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener("focus", sync); document.removeEventListener("visibilitychange", sync); active.current?.abort(); active.current = null; };
  }, [refresh, intervalMs]);
  return { data, loading, error, status, refresh };
}
