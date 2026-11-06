"use client";

import { useEffect, useState } from "react";

/** Current time that re-renders every `intervalMs` (for relative labels and the 24h window). */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
