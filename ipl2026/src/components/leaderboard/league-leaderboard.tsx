"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Trophy, RefreshCw } from "lucide-react";
import { getLeaderboard, getPlayerGames } from "@/lib/api";
import type { LeaderboardPlayer, PlayerMatch } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LottieLoader } from "@/components/ui/lottie-loader";
import { cn } from "@/lib/utils";

function initial(name: string | undefined) {
  return name?.charAt(0).toUpperCase() || "?";
}

function PlayerAvatar({
  picture,
  name,
  className,
}: {
  picture: string | null;
  name: string;
  className?: string;
}) {
  if (picture) {
    if (picture.startsWith("data:")) {
      return (
        <img
          src={picture}
          alt={name}
          className={cn("rounded-full object-cover", className)}
        />
      );
    }

    return (
      <Image
        src={picture}
        alt={name}
        width={64}
        height={64}
        className={cn("rounded-full object-cover", className)}
        unoptimized
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-muted text-lg font-semibold",
        className
      )}
    >
      {initial(name)}
    </div>
  );
}

function PlayerMatchesDialog({
  player,
  open,
  onOpenChange,
}: {
  player: LeaderboardPlayer | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [matches, setMatches] = useState<PlayerMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !player) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getPlayerGames(player.user_id);
        if (!cancelled) setMatches(data.matches || []);
      } catch (e) {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Failed to load matches");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, player]);

  if (!player) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{player.display_name}&apos;s IPL matches</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat label="Total pts" value={String(player.total_points)} />
          <Stat label="Matches" value={String(player.matches_played)} />
          <Stat label="Average" value={`${player.average_points}`} />
          <Stat
            label="Best rank"
            value={player.best_rank ? `P${player.best_rank}` : "N/A"}
          />
        </div>
        <ScrollArea className="max-h-[50vh] pr-3">
          {loading && <LottieLoader label="Loading matches..." size={72} />}
          {!loading && err && (
            <p className="text-destructive py-4 text-center text-sm">{err}</p>
          )}
          {!loading && !err && matches.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No IPL matches found for this player.
            </p>
          )}
          <div className="space-y-2 pb-2">
            {matches.map((g) => (
              <Card key={g.id} className="p-3">
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>{formatDate(g.match_date)}</span>
                  <span>IPL match</span>
                </div>
                <p className="mt-1 font-medium">{g.match_name}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Rank P{g.user_rank}</span>
                  <span className="font-semibold">{g.points} pts</span>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg border px-2 py-1.5 text-center">
      <div className="text-muted-foreground text-[0.65rem] uppercase tracking-wide">
        {label}
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

export function LeagueLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<LeaderboardPlayer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getLeaderboard();
      setLeaderboard(data.leaderboard || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <LottieLoader label="Loading leaderboard..." />
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-destructive max-w-sm text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 size-4" />
          Try again
        </Button>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-8 pb-4">
      <div className="text-center">
        <h2 className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight">
          <Trophy className="text-amber-500 size-7" />
          Champions League
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Top fantasy cricket players
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <p className="text-4xl">🏏</p>
          <h3 className="mt-3 font-semibold">No rankings yet</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Be the first to play and climb the leaderboard.
          </p>
        </Card>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="mx-auto grid max-w-lg grid-cols-3 items-end gap-2 px-1 sm:max-w-2xl sm:gap-4">
              {top3[1] && (
                <PodiumCard
                  player={top3[1]}
                  rank={2}
                  tone="silver"
                  onClick={() => setSelected(top3[1])}
                />
              )}
              {top3[0] && (
                <PodiumCard
                  player={top3[0]}
                  rank={1}
                  tone="gold"
                  tall
                  onClick={() => setSelected(top3[0])}
                />
              )}
              {top3[2] && (
                <PodiumCard
                  player={top3[2]}
                  rank={3}
                  tone="bronze"
                  onClick={() => setSelected(top3[2])}
                />
              )}
            </div>
          )}

          {rest.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="font-semibold">All rankings</h3>
                <span className="text-muted-foreground text-xs">
                  {leaderboard.length} players
                </span>
              </div>
              <div className="space-y-2">
                {rest.map((player, i) => {
                  const rank = i + 4;
                  return (
                    <Card
                      key={player.user_id}
                      className="group hover:bg-muted/40 relative overflow-hidden border-border/70 bg-card/70 shadow-sm transition-all hover:shadow-md"
                      onClick={() => setSelected(player)}
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400/80 via-sky-500/60 to-emerald-400/70 opacity-70 transition-opacity group-hover:opacity-100" />
                      <div className="flex items-center gap-3 p-3 pl-4">
                        <div className="bg-muted text-muted-foreground w-9 rounded-md py-1 text-center font-mono text-sm font-semibold">
                          #{rank}
                        </div>
                        <PlayerAvatar
                          picture={player.profilePicture}
                          name={player.display_name}
                          className="size-10 shrink-0 text-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {player.display_name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {player.matches_played} matches · {player.average_points} avg
                            {player.best_rank != null &&
                              ` · Best P${player.best_rank}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold tabular-nums">
                            {player.total_points.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground text-[0.65rem]">
                            pts
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <PlayerMatchesDialog
        player={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}

function PodiumCard({
  player,
  rank,
  tone,
  tall,
  onClick,
}: {
  player: LeaderboardPlayer;
  rank: number;
  tone: "gold" | "silver" | "bronze";
  tall?: boolean;
  onClick: () => void;
}) {
  const highlight =
    tone === "gold"
      ? "border-amber-400/70 ring-2 ring-amber-300/35 shadow-[0_0_20px_rgba(251,191,36,0.25)]"
      : tone === "silver"
        ? "border-slate-300/80 ring-2 ring-slate-200/35 shadow-[0_0_18px_rgba(203,213,225,0.22)]"
        : "border-amber-700/80 ring-2 ring-amber-700/30 shadow-[0_0_18px_rgba(180,83,9,0.2)]";

  const avatarRing =
    tone === "gold"
      ? "ring-2 ring-amber-400/60"
      : tone === "silver"
        ? "ring-2 ring-slate-300/60"
        : "ring-2 ring-amber-700/55";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "bg-card/95 flex w-full flex-col items-center rounded-xl border p-2 text-center shadow-sm transition-transform hover:scale-[1.02] sm:p-3",
        highlight,
        tall && "sm:-mt-2 sm:pb-4",
        tall ? "order-none sm:order-none" : ""
      )}
    >
      <span className="text-muted-foreground text-xs font-medium">
        {rank === 1 ? "👑 " : ""}#{rank}
      </span>
      <PlayerAvatar
        picture={player.profilePicture}
        name={player.display_name}
        className={cn("my-2 size-14 sm:size-16", avatarRing)}
      />
      <p className="max-w-full truncate text-sm font-semibold">
        {player.display_name}
      </p>
      <p className="text-primary text-lg font-bold tabular-nums">
        {player.total_points.toLocaleString()}
      </p>
      <p className="text-muted-foreground text-[0.65rem]">
        {player.matches_played} matches
      </p>
    </button>
  );
}
