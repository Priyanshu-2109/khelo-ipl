import type {
  AdminGame,
  AppUser,
  LeaderboardPlayer,
  PasswordRequirements,
  PlayerMatch,
  RankingsUser,
  ScoringProfile,
} from "@/types";

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return (data.detail as string) || (data.error as string) || res.statusText;
  } catch {
    return res.statusText;
  }
}

function reqInit(init?: RequestInit): RequestInit {
  return {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    },
  };
}

/** Email/password signup — session is created via signIn after this succeeds. */
export async function registerAccount(
  displayName: string,
  email: string,
  password: string
): Promise<void> {
  const res = await fetch("/api/register", {
    method: "POST",
    ...reqInit(),
    body: JSON.stringify({ displayName, email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function forgotPassword(
  email: string
): Promise<{ debug_otp?: string }> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    ...reqInit(),
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || "Request failed");
  return data;
}

export async function resetPassword(
  token: string,
  password: string
): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    ...reqInit(),
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.detail || data.error || "Password reset failed");
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  password: string
): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    ...reqInit(),
    body: JSON.stringify({ email, otp, password }),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.detail || data.error || "Password reset failed");
}

export async function validateResetToken(
  token: string
): Promise<{ valid: boolean }> {
  const res = await fetch("/api/auth/validate-reset-token", {
    method: "POST",
    ...reqInit(),
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || "Validation failed");
  return data;
}

export async function getPasswordRequirements(): Promise<PasswordRequirements> {
  const res = await fetch("/api/auth/password-requirements", reqInit());
  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch password requirements");
  return data;
}

export async function getCurrentUser(): Promise<{ user: AppUser }> {
  const res = await fetch("/api/auth/me", reqInit());
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to get user");
  return data;
}

export async function getLeaderboard(): Promise<{
  leaderboard: LeaderboardPlayer[];
}> {
  const res = await fetch("/api/leaderboard", reqInit());
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.detail || data.error || "Failed to fetch leaderboard");
  return data;
}

export async function getPlayerGames(
  userId: string
): Promise<{ matches: PlayerMatch[] }> {
  const res = await fetch(`/api/players/${userId}/games`, reqInit());
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.detail || data.error || "Failed to fetch player games");
  return data;
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const res = await fetch("/api/profile/display-name", {
    method: "PUT",
    ...reqInit(),
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch("/api/profile/password", {
    method: "PUT",
    ...reqInit(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function uploadProfilePicture(
  profilePicture: string
): Promise<void> {
  const res = await fetch("/api/profile/picture", {
    method: "PUT",
    ...reqInit(),
    body: JSON.stringify({ profilePicture }),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteProfilePicture(): Promise<void> {
  const res = await fetch("/api/profile/picture", {
    method: "DELETE",
    ...reqInit(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export function fileToBase64(file: File): Promise<string> {
  if (file.size > 2 * 1024 * 1024) {
    return Promise.reject(new Error("File size must be less than 2MB"));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function getScoringProfiles(): Promise<{
  profiles: ScoringProfile[];
}> {
  const res = await fetch("/api/admin/scoring-profiles", reqInit());
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createScoringProfile(
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch("/api/admin/scoring-profiles", {
    method: "POST",
    ...reqInit(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function updateScoringProfile(
  id: string,
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`/api/admin/scoring-profiles/${id}`, {
    method: "PUT",
    ...reqInit(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteScoringProfile(id: string): Promise<void> {
  const res = await fetch(`/api/admin/scoring-profiles/${id}`, {
    method: "DELETE",
    ...reqInit(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function getAdminGames(): Promise<{ games: AdminGame[] }> {
  const res = await fetch("/api/admin/games", reqInit());
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function createAdminGame(
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch("/api/admin/games", {
    method: "POST",
    ...reqInit(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function deleteAdminGame(id: string): Promise<void> {
  const res = await fetch(`/api/admin/games/${id}`, {
    method: "DELETE",
    ...reqInit(),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function getGameRankings(gameId: string): Promise<{
  users: RankingsUser[];
  rankings?: { user_id: string; fantasy_points: number }[];
}> {
  const res = await fetch(`/api/admin/games/${gameId}/rankings`, reqInit());
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function submitRankings(body: {
  game_id: string;
  points: { user_id: string; fantasy_points: number }[];
}): Promise<void> {
  const res = await fetch("/api/admin/points", {
    method: "POST",
    ...reqInit(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
}
