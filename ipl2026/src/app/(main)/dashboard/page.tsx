"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getCurrentUser } from "@/lib/api";
import type { AppUser } from "@/types";
import { LeagueLeaderboard } from "@/components/leaderboard/league-leaderboard";
import { LottieLoader } from "@/components/ui/lottie-loader";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled && session?.user) {
          setUser({
            id: session.user.id,
            displayName: session.user.displayName ?? session.user.name ?? "",
            email: session.user.email ?? "",
            isAdmin: session.user.isAdmin,
            profilePicture:
              (session.user as { profilePicture?: string | null })
                .profilePicture ?? null,
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user]);

  if (status === "loading" || (status === "authenticated" && !user)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LottieLoader label="Loading dashboard..." size={84} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-4 pt-4 sm:px-4 sm:pt-6 lg:px-6">
      <header className="mb-5">
        <p className="text-muted-foreground text-sm">Welcome back</p>
        <h1 className="text-foreground truncate text-xl font-bold tracking-tight sm:text-2xl">
          Hi, {user.displayName}
        </h1>
      </header>
      <main className="mx-auto max-w-3xl">
        <LeagueLeaderboard />
      </main>
    </div>
  );
}
