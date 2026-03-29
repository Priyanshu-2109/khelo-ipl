"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { ArrowLeft, LogOut } from "lucide-react";
import {
  deleteProfilePicture,
  fileToBase64,
  getCurrentUser,
  updateDisplayName,
  updatePassword,
  uploadProfilePicture,
} from "@/lib/api";
import type { AppUser } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LottieLoader } from "@/components/ui/lottie-loader";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (!cancelled) {
          setUser(data.user);
          setDisplayName(data.user.displayName);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load profile");
        if (session?.user) {
          setUser({
            id: session.user.id,
            displayName: session.user.displayName ?? session.user.name ?? "",
            email: session.user.email ?? "",
            isAdmin: session.user.isAdmin,
            profilePicture:
              (session.user as { profilePicture?: string | null })
                .profilePicture ?? null,
          });
          setDisplayName(
            session.user.displayName ?? session.user.name ?? ""
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user]);

  const handleDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters");
      return;
    }
    try {
      await updateDisplayName(displayName.trim());
      const next = { ...user!, displayName: displayName.trim() };
      setUser(next);
      await update({ displayName: next.displayName });
      setMessage("Display name updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    try {
      await updatePassword(currentPassword, newPassword);
      setMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const b64 = await fileToBase64(file);
      await uploadProfilePicture(b64);
      setUser((prev) => (prev ? { ...prev, profilePicture: b64 } : null));
      await update();
      setMessage("Profile picture updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removePicture = async () => {
    if (!confirm("Remove your profile picture?")) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      await deleteProfilePicture();
      setUser((prev) => (prev ? { ...prev, profilePicture: null } : null));
      await update();
      setMessage("Picture removed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  const logout = () =>
    signOut({ callbackUrl: "/login", redirect: true });

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LottieLoader label="Loading profile..." size={84} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      <header className="bg-card/70 mb-4 flex items-center justify-between gap-2 rounded-xl border px-3 py-3 sm:px-4">
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 px-2"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="mr-1 size-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <h1 className="truncate text-center text-sm font-semibold sm:text-base">
          My profile
        </h1>
        <Button variant="ghost" size="sm" className="shrink-0 px-2" onClick={logout}>
          <LogOut className="size-4 sm:mr-1" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </header>

      <div className="mx-auto max-w-md space-y-4">
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center">
          <div className="relative">
            {user.profilePicture ? (
              user.profilePicture.startsWith("data:") ? (
                <img
                  src={user.profilePicture}
                  alt=""
                  className="size-28 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <Image
                  src={user.profilePicture}
                  alt=""
                  width={112}
                  height={112}
                  className="rounded-full object-cover ring-2 ring-primary/20"
                  unoptimized
                />
              )
            ) : (
              <div className="bg-muted flex size-28 items-center justify-center rounded-full text-3xl font-semibold ring-2 ring-border">
                {user.displayName?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs text-white">
                …
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {user.profilePicture ? "Change" : "Upload"}
            </Button>
            {user.profilePicture && (
              <Button
                size="sm"
                variant="secondary"
                disabled={uploading}
                onClick={removePicture}
              >
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
          <p className="text-muted-foreground mt-2 text-xs">
            Max 2MB · JPG, PNG, GIF
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm">
              Security
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4">
            <form onSubmit={handleDisplayName} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user.email} disabled className="mt-1 opacity-70" />
              </div>
              <div>
                <Label htmlFor="dn">Display name</Label>
                <Input
                  id="dn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Update profile
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="security" className="mt-4">
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <Label htmlFor="cp">Current password</Label>
                <Input
                  id="cp"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="np">New password</Label>
                <Input
                  id="np"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cnp">Confirm new password</Label>
                <Input
                  id="cnp"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Update password
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
