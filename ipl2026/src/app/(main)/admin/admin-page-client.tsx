"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminSetupCard } from "@/components/admin/admin-setup-card";

export function AdminPageClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/setup", { cache: "no-store" });
        const data = await response.json();
        if (!cancelled) {
          setConfigured(Boolean(data?.configured));
        }
      } catch {
        if (!cancelled) {
          setConfigured(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (configured !== true || status === "loading") return;
    if (!session?.user?.id) {
      router.replace("/login?callbackUrl=/admin");
      return;
    }
    if (!session.user.isAdmin) {
      router.replace("/dashboard");
    }
  }, [configured, status, session, router]);

  if (configured === null || (configured && status === "loading")) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!configured) {
    return <AdminSetupCard />;
  }

  if (!session?.user?.id || !session.user.isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Redirecting…</p>
      </div>
    );
  }

  return <AdminPanel />;
}
