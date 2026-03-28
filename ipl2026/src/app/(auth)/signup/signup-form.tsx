"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Info } from "lucide-react";
import { getPasswordRequirements, registerAccount } from "@/lib/api";
import { usePasswordStrength } from "@/hooks/use-password-strength";
import type { PasswordRequirements } from "@/types";
import { KheloLogo } from "@/components/khelo-logo";
import { ClientOnly } from "@/components/client-only";
import { PasswordRequirementsList } from "@/components/password-requirements-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

function FormSkeleton() {
  return (
    <CardContent className="space-y-4 py-6">
      <div className="bg-muted h-10 animate-pulse rounded-lg" />
      <div className="bg-muted h-10 animate-pulse rounded-lg" />
      <div className="bg-muted h-10 animate-pulse rounded-lg" />
      <div className="bg-muted h-10 animate-pulse rounded-lg" />
    </CardContent>
  );
}

export function SignupForm({ showGoogle }: { showGoogle: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [req, setReq] = useState<PasswordRequirements | null>(null);
  const [nameHint, setNameHint] = useState(false);
  const strength = usePasswordStrength(password, req);

  useEffect(() => {
    getPasswordRequirements().then(setReq).catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await registerAccount(name, email, password);
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Account created but sign-in failed. Try logging in.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-xl ring-1 ring-navy/5">
      <CardHeader className="flex flex-col items-center space-y-2 pb-2">
        <KheloLogo className="size-24 object-contain sm:size-28" />
        <h1 className="text-xl font-bold tracking-tight">Join Khelo IPL</h1>
        <p className="text-muted-foreground text-sm">Create your player account</p>
      </CardHeader>
      <ClientOnly fallback={<FormSkeleton />}>
        <CardContent className="space-y-4">
          {showGoogle && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full border-navy/20"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              >
                Sign up with Google
              </Button>
              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-muted-foreground text-xs">or email</span>
                <Separator className="flex-1" />
              </div>
            </>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-1">
                <Label htmlFor="name">Display name</Label>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground inline-flex"
                  aria-expanded={nameHint}
                  aria-label="About display name"
                  onClick={() => setNameHint((v) => !v)}
                >
                  <Info className="size-3.5" />
                </button>
              </div>
              {nameHint && (
                <p className="text-muted-foreground mb-2 rounded-md border bg-muted/40 px-2 py-1.5 text-xs">
                  Shown on the leaderboard to other players.
                </p>
              )}
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setShowPw(!showPw)}
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {req && password && (
              <PasswordRequirementsList requirements={req} strength={strength} />
            )}
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm"
                  type={showCf ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setShowCf(!showCf)}
                  aria-label="Toggle confirm password"
                >
                  {showCf ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-4">
          <p className="text-muted-foreground text-sm">
            Already registered?{" "}
            <Link
              href="/login"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </ClientOnly>
    </Card>
  );
}
