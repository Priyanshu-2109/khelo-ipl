"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminSetupCard() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("IPL Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/setup", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data.configured) {
          router.replace("/login?callbackUrl=/admin");
          return;
        }
      } catch {
        if (!cancelled) {
          setError("Unable to verify admin setup status");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.detail || "Failed to setup admin credentials");
        return;
      }

      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (login?.error) {
        setError("Admin created, but auto sign-in failed. Please login manually.");
        router.push("/login?callbackUrl=/admin");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong while creating admin credentials");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-xl items-center justify-center px-3 sm:px-4">
        <p className="text-muted-foreground text-sm">Preparing admin setup…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl items-center justify-center px-3 py-6 sm:px-4 sm:py-10">
      <Card className="w-full border-border/80 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto rounded-full bg-primary/10 p-3 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <CardTitle className="text-xl">Setup Admin Credentials</CardTitle>
          <CardDescription>
            Create the first admin account to unlock the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-name">Admin name</Label>
              <Input
                id="admin-name"
                className="mt-1"
                value={displayName}
                minLength={2}
                maxLength={100}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="admin-email">Admin email</Label>
              <Input
                id="admin-email"
                className="mt-1"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="admin-password-confirm">Confirm password</Label>
              <Input
                id="admin-password-confirm"
                className="mt-1"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating admin account…" : "Create admin account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
