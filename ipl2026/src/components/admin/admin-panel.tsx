"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Pencil,
  Plus,
  Target,
  Trash2,
  Trophy,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  createAdminGame,
  createScoringProfile,
  deleteAdminGame,
  deleteScoringProfile,
  getAdminGames,
  getGameRankings,
  getScoringProfiles,
  submitRankings,
  updateScoringProfile,
} from "@/lib/api";
import type { AdminGame, RankingsUser, ScoringProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LottieLoader } from "../ui/lottie-loader";
import { cn } from "@/lib/utils";

type TabKey = "schedule" | "rankings" | "profiles";
type ModalType =
  | "addGame"
  | "addProfile"
  | "editProfile"
  | "enterPoints"
  | null;

const defaultDistribution: Record<string, number> = {
  "1": 35,
  "2": 30,
  "3": 25,
  "4": 20,
  "5": 15,
  "6": 10,
  "7": 5,
  "8": 0,
  "9": 0,
  "10": 0,
};

export function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const [games, setGames] = useState<AdminGame[]>([]);
  const [profiles, setProfiles] = useState<ScoringProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedGame, setSelectedGame] = useState<AdminGame | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ScoringProfile | null>(
    null
  );
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [fantasyPoints, setFantasyPoints] = useState<Record<string, string>>(
    {}
  );
  const [rankingUsers, setRankingUsers] = useState<RankingsUser[]>([]);
  const [savingGame, setSavingGame] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingPoints, setSubmittingPoints] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);

  const actionBtnClass =
    "transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
  const primaryActionBtnClass = `${actionBtnClass} shadow-sm hover:shadow-md`;
  const destructiveActionBtnClass = `${actionBtnClass} hover:brightness-95`;

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.isAdmin) {
      router.replace("/dashboard");
    }
  }, [router, session?.user?.isAdmin, status]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "schedule" || activeTab === "rankings") {
        const g = await getAdminGames();
        setGames(g.games || []);
      }
      if (activeTab === "profiles" || activeTab === "schedule") {
        const p = await getScoringProfiles();
        setProfiles(p.profiles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddGame = () => {
    setModalType("addGame");
    setFormData({
      match_name: "",
      match_date: new Date().toISOString().split("T")[0],
      match_time: "19:30",
      venue: "",
      scoring_profile_id:
        profiles.find((p) => p.is_default)?.id ?? profiles[0]?.id ?? null,
    });
  };

  const openAddProfile = () => {
    setSelectedProfile(null);
    setModalType("addProfile");
    setFormData({
      name: "",
      description: "",
      point_distribution: { ...defaultDistribution },
      is_multiplier: false,
      multiplier: 1.0,
      max_ranks: 10,
    });
  };

  const openEditProfile = (p: ScoringProfile) => {
    setSelectedProfile(p);
    setModalType("editProfile");
    setFormData({ ...p });
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedGame(null);
    setFantasyPoints({});
    setRankingUsers([]);
  };

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGame(true);
    try {
      await createAdminGame(formData);
      closeModal();
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingGame(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (selectedProfile) {
        await updateScoringProfile(selectedProfile.id, formData);
      } else {
        await createScoringProfile(formData);
      }
      closeModal();
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingProfile(false);
    }
  };

  const loadPointsEntry = async (game: AdminGame) => {
    try {
      const data = await getGameRankings(game.id);
      setSelectedGame(game);
      setRankingUsers(data.users || []);
      const pointsMap: Record<string, string> = {};
      if (data.rankings && Array.isArray(data.rankings)) {
        data.rankings.forEach((r) => {
          pointsMap[String(r.user_id)] = String(r.fantasy_points ?? 0);
        });
      }
      setFantasyPoints(pointsMap);
      setModalType("enterPoints");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load rankings");
    }
  };

  const handlePointsSubmit = async () => {
    const entries = Object.entries(fantasyPoints)
      .filter(([, pts]) => Number(pts) > 0)
      .map(([userId, pts]) => ({
        user_id: userId,
        fantasy_points: parseInt(String(pts), 10),
      }));
    if (entries.length === 0) {
      alert("Enter fantasy points for at least one player");
      return;
    }
    if (!selectedGame) return;
    setSubmittingPoints(true);
    try {
      await submitRankings({
        game_id: selectedGame.id,
        points: entries,
      });
      closeModal();
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmittingPoints(false);
    }
  };

  const applyTemplate = (template: "double" | "top15" | "winner") => {
    let dist: Record<string, number> = {};
    if (template === "double") {
      dist = {
        "1": 70,
        "2": 60,
        "3": 50,
        "4": 40,
        "5": 30,
        "6": 20,
        "7": 10,
        "8": 0,
        "9": 0,
        "10": 0,
      };
      setFormData({
        ...formData,
        name: "Double Points",
        description: "2x standard points",
        point_distribution: dist,
        is_multiplier: true,
        multiplier: 2.0,
        max_ranks: 10,
      });
    } else if (template === "top15") {
      dist = {
        "1": 35,
        "2": 30,
        "3": 25,
        "4": 20,
        "5": 15,
        "6": 10,
        "7": 5,
        "8": 0,
        "9": 0,
        "10": 0,
        "11": 0,
        "12": 0,
        "13": 0,
        "14": 0,
        "15": 0,
      };
      setFormData({
        ...formData,
        name: "Top 15",
        description: "Top 15 players get points",
        point_distribution: dist,
        max_ranks: 15,
      });
    } else {
      dist = { "1": 100 };
      setFormData({
        ...formData,
        name: "Winner Takes All",
        description: "Only 1st place gets points",
        point_distribution: dist,
        max_ranks: 1,
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-4 lg:px-6">
      <header className="bg-card/70 mb-4 flex items-center justify-between rounded-xl border px-3 py-3 sm:px-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-1 size-4" />
          Back
        </Button>
        <h1 className="text-sm font-semibold sm:text-base">Admin panel</h1>
        <span className="w-16" />
      </header>

      <div className="min-w-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabKey)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/40 p-1">
            <TabsTrigger
              value="schedule"
              className={cn(
                "gap-1.5 rounded-lg border border-transparent text-xs font-medium text-muted-foreground transition-all hover:text-foreground sm:text-sm",
                activeTab === "schedule" &&
                  "border-primary/30 bg-primary/10 text-foreground shadow-sm"
              )}
            >
              <span
                className={cn(
                  "rounded-md bg-muted/70 p-1 transition-colors",
                  activeTab === "schedule" && "bg-primary/20 text-primary"
                )}
              >
                <Calendar className="size-3.5 sm:size-4" />
              </span>
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger
              value="rankings"
              className={cn(
                "gap-1.5 rounded-lg border border-transparent text-xs font-medium text-muted-foreground transition-all hover:text-foreground sm:text-sm",
                activeTab === "rankings" &&
                  "border-primary/30 bg-primary/10 text-foreground shadow-sm"
              )}
            >
              <span
                className={cn(
                  "rounded-md bg-muted/70 p-1 transition-colors",
                  activeTab === "rankings" && "bg-primary/20 text-primary"
                )}
              >
                <Target className="size-3.5 sm:size-4" />
              </span>
              <span>Points</span>
            </TabsTrigger>
            <TabsTrigger
              value="profiles"
              className={cn(
                "gap-1.5 rounded-lg border border-transparent text-xs font-medium text-muted-foreground transition-all hover:text-foreground sm:text-sm",
                activeTab === "profiles" &&
                  "border-primary/30 bg-primary/10 text-foreground shadow-sm"
              )}
            >
              <span
                className={cn(
                  "rounded-md bg-muted/70 p-1 transition-colors",
                  activeTab === "profiles" && "bg-primary/20 text-primary"
                )}
              >
                <Trophy className="size-3.5 sm:size-4" />
              </span>
              <span>Profiles</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4">
            {loading ? (
              <LottieLoader label="Loading schedule..." />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className={cn(
                      primaryActionBtnClass,
                      "border border-primary/35 bg-primary/15 text-primary hover:bg-primary/25"
                    )}
                    onClick={openAddGame}
                    disabled={profiles.length === 0}
                  >
                    <Plus className="mr-1 size-4" />
                    Add game
                  </Button>
                </div>
                {profiles.length === 0 && (
                  <p className="text-muted-foreground text-center text-xs">
                    Create a scoring profile first (Profiles tab).
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {games.map((game) => (
                    <Card
                      key={game.id}
                      className="group min-w-0 overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="min-w-0 break-words font-semibold leading-tight">
                          {game.match_name}
                        </h3>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wide",
                            game.is_completed
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          )}
                        >
                          {game.is_completed ? "Complete" : "Pending"}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {new Date(game.match_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {game.match_time && ` · ${game.match_time}`}
                      </p>
                      {game.venue && (
                        <p className="text-muted-foreground text-sm">{game.venue}</p>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs font-medium">
                        Profile: {game.scoring_profile_name || "Default"}
                      </p>
                      <Button
                        variant="destructive"
                        size="xs"
                        className={cn(
                          "mt-3 border border-destructive/40 bg-destructive/90 text-destructive-foreground hover:bg-destructive",
                          destructiveActionBtnClass
                        )}
                        disabled={deletingGameId === game.id}
                        onClick={async () => {
                          if (!confirm("Delete this game?")) return;
                          setDeletingGameId(game.id);
                          try {
                            await deleteAdminGame(game.id);
                            loadData();
                          } catch (err) {
                            alert(
                              err instanceof Error ? err.message : "Delete failed"
                            );
                          } finally {
                            setDeletingGameId(null);
                          }
                        }}
                      >
                        {deletingGameId === game.id ? (
                          <>
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-1 size-3.5" />
                            Delete
                          </>
                        )}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rankings" className="mt-4">
            {loading ? (
              <LottieLoader label="Loading points..." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {games.map((game) => (
                  <Card
                    key={game.id}
                    className="group hover:bg-muted/40 min-w-0 cursor-pointer overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    onClick={() => loadPointsEntry(game)}
                  >
                    <div className="flex justify-between gap-2">
                      <h3 className="min-w-0 break-words font-semibold">
                        {game.match_name}
                      </h3>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {game.is_completed ? "Edit" : "Enter"}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                      {new Date(game.match_date).toLocaleDateString("en-IN")}
                    </p>
                    <p className="mt-2 inline-flex items-center text-xs font-medium text-primary/90">
                      <Target className="mr-1 size-3.5" />
                      Click to manage fantasy points
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profiles" className="mt-4">
            {loading ? (
              <LottieLoader label="Loading profiles..." />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className={cn(
                      primaryActionBtnClass,
                      "border border-primary/35 bg-primary/15 text-primary hover:bg-primary/25"
                    )}
                    onClick={openAddProfile}
                  >
                    <Plus className="mr-1 size-4" />
                    Create profile
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {profiles.map((profile) => (
                    <Card
                      key={profile.id}
                      className="min-w-0 overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <h3 className="font-semibold leading-tight">
                        {profile.name}{" "}
                        {profile.is_default && (
                          <span className="text-amber-500">★</span>
                        )}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                        {profile.description}
                      </p>
                      {profile.is_multiplier && (
                        <p className="mt-2 text-xs font-medium">
                          {profile.multiplier}x multiplier
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(profile.point_distribution)
                          .slice(0, 5)
                          .map(([r, pts]) => (
                            <span
                              key={r}
                              className="bg-muted rounded px-1.5 py-0.5 text-[0.65rem]"
                            >
                              P{r}: {pts}
                            </span>
                          ))}
                        {Object.keys(profile.point_distribution).length > 5 && (
                          <span className="text-muted-foreground text-[0.65rem]">
                            +
                            {Object.keys(profile.point_distribution).length - 5}{" "}
                            more
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          className={cn(
                            actionBtnClass,
                            "border border-border/80 bg-background/90 text-foreground hover:bg-muted"
                          )}
                          onClick={() => openEditProfile(profile)}
                        >
                          <Pencil className="mr-1 size-3.5" />
                          Edit
                        </Button>
                        {!profile.is_default && (
                          <Button
                            variant="destructive"
                            size="xs"
                            className={cn(
                              destructiveActionBtnClass,
                              "border border-destructive/40 bg-destructive/90 text-destructive-foreground hover:bg-destructive"
                            )}
                            disabled={deletingProfileId === profile.id}
                            onClick={async () => {
                              if (!confirm("Delete this profile?")) return;
                              setDeletingProfileId(profile.id);
                              try {
                                await deleteScoringProfile(profile.id);
                                loadData();
                              } catch (err) {
                                alert(
                                  err instanceof Error
                                    ? err.message
                                    : "Delete failed"
                                );
                              } finally {
                                setDeletingProfileId(null);
                              }
                            }}
                          >
                            {deletingProfileId === profile.id ? (
                              <>
                                <Loader2 className="mr-1 size-3.5 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-1 size-3.5" />
                                Delete
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={modalType !== null} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent
          className="max-h-[90vh] max-w-lg overflow-y-auto"
          showCloseButton
        >
          {modalType === "addGame" && (
            <form onSubmit={handleGameSubmit}>
              <DialogHeader>
                <DialogTitle>Add match</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label htmlFor="mn">Match name</Label>
                  <Input
                    id="mn"
                    required
                    value={(formData.match_name as string) || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, match_name: e.target.value })
                    }
                    placeholder="e.g. MI vs CSK"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="md">Date</Label>
                    <Input
                      id="md"
                      type="date"
                      required
                      value={(formData.match_date as string) || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, match_date: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mt">Time</Label>
                    <Input
                      id="mt"
                      type="time"
                      value={(formData.match_time as string) || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, match_time: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={(formData.venue as string) || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                    placeholder="Stadium"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sp">Scoring profile</Label>
                  <select
                    id="sp"
                    required
                    className="border-input bg-background mt-1 flex h-8 w-full rounded-lg border px-2.5 text-sm"
                    value={String(formData.scoring_profile_id ?? "")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        scoring_profile_id: e.target.value,
                      })
                    }
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className={actionBtnClass}
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={primaryActionBtnClass}
                  disabled={savingGame}
                >
                  {savingGame && <Loader2 className="mr-1 size-4 animate-spin" />}
                  {savingGame ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          )}

          {(modalType === "addProfile" || modalType === "editProfile") && (
            <form onSubmit={handleProfileSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {modalType === "editProfile"
                    ? "Edit scoring profile"
                    : "Create scoring profile"}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => applyTemplate("double")}
                >
                  2× points
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => applyTemplate("top15")}
                >
                  Top 15
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => applyTemplate("winner")}
                >
                  Winner only
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    required
                    value={(formData.name as string) || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={(formData.description as string) || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!formData.is_multiplier}
                    onCheckedChange={(c) =>
                      setFormData({ ...formData, is_multiplier: !!c })
                    }
                  />
                  Multiplier mode
                </label>
                {!!formData.is_multiplier && (
                  <div>
                    <Label>Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={String(formData.multiplier ?? 1)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          multiplier: parseFloat(e.target.value),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                )}
                <div>
                  <Label>Max ranks</Label>
                  <Input
                    type="number"
                    value={String(formData.max_ranks ?? 10)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_ranks: parseInt(e.target.value, 10),
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className={actionBtnClass}
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={primaryActionBtnClass}
                  disabled={savingProfile}
                >
                  {savingProfile && (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  )}
                  {savingProfile
                    ? modalType === "editProfile"
                      ? "Updating..."
                      : "Creating..."
                    : modalType === "editProfile"
                      ? "Update"
                      : "Create"}
                </Button>
              </DialogFooter>
            </form>
          )}

          {modalType === "enterPoints" && selectedGame && (
            <div className="flex max-h-[80vh] min-h-0 flex-col">
              <DialogHeader>
                <DialogTitle>Points — {selectedGame.match_name}</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground text-sm">
                Enter each player&apos;s fantasy points. Ranks are calculated on
                the server.
              </p>
              <ScrollArea className="mt-3 min-h-0 flex-1 pr-3">
                <div className="space-y-3 pb-3">
                  {rankingUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {u.display_name}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Pts"
                        className="w-full sm:w-24"
                        value={fantasyPoints[String(u.id)] ?? ""}
                        onChange={(e) =>
                          setFantasyPoints({
                            ...fantasyPoints,
                            [String(u.id)]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-3 flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className={actionBtnClass}
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className={primaryActionBtnClass}
                  onClick={handlePointsSubmit}
                  disabled={submittingPoints}
                >
                  {submittingPoints && (
                    <Loader2 className="mr-1 size-4 animate-spin" />
                  )}
                  {submittingPoints ? "Submitting..." : "Submit points"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
