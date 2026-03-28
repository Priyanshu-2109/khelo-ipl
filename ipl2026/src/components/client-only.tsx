"use client";

import { useEffect, useState } from "react";

/**
 * Renders children only after mount so form controls are not part of the SSR
 * HTML tree. This avoids hydration mismatches when browser extensions inject
 * attributes (e.g. fdprocessedid) into inputs before React hydrates.
 */
export function ClientOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready) {
    return fallback ?? null;
  }
  return children;
}
