"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [status, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );
}
