"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import {
  getPasswordRequirements,
  resetPassword,
  validateResetToken,
} from "@/lib/api";
import { usePasswordStrength } from "@/hooks/use-password-strength";
import type { PasswordRequirements } from "@/types";
import { ClientOnly } from "@/components/client-only";
import { KheloLogo } from "@/components/khelo-logo";
import { PasswordRequirementsList } from "@/components/password-requirements-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LottieLoader } from "@/components/ui/lottie-loader";

function FormSkeleton() {
  return (
    <CardContent className="py-6">
      <div className="space-y-3">
        <div className="bg-muted h-10 animate-pulse rounded-lg" />
        <div className="bg-muted h-10 animate-pulse rounded-lg" />
      </div>
    </CardContent>
  );
}

function ResetFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenOk, setTokenOk] = useState(false);
  const [success, setSuccess] = useState(false);
  const [req, setReq] = useState<PasswordRequirements | null>(null);
  const strength = usePasswordStrength(password, req);

  useEffect(() => {
    getPasswordRequirements().then(setReq).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link");
      setValidating(false);
      return;
    }
    validateResetToken(token)
      .then((d) => {
        setTokenOk(d.valid);
        if (!d.valid) setError("This link has expired or is invalid.");
      })
      .catch(() => {
        setError("Invalid reset link");
        setTokenOk(false);
      })
      .finally(() => setValidating(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <Card className="border-border/80 p-8 text-center shadow-lg">
        <p className="text-muted-foreground text-sm">Validating link…</p>
      </Card>
    );
  }

  if (!tokenOk) {
    return (
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="flex flex-col items-center">
          <KheloLogo className="size-24 object-contain" />
          <h1 className="text-xl font-bold">Link expired</h1>
          <p className="text-muted-foreground text-center text-sm">{error}</p>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/forgot-password"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Request new link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="flex flex-col items-center text-center">
          <KheloLogo className="size-24 object-contain" />
          <div className="mt-2 text-2xl text-emerald-600">✓</div>
          <h1 className="text-xl font-bold">Password reset</h1>
          <p className="text-muted-foreground text-sm">
            Redirecting to sign in…
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader className="flex flex-col items-center space-y-2 pb-2">
        <KheloLogo className="size-24 object-contain" />
        <h1 className="text-xl font-bold">New password</h1>
        <p className="text-muted-foreground text-sm">Choose a strong password</p>
      </CardHeader>
      <ClientOnly fallback={<FormSkeleton />}>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
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
              {loading ? "Saving…" : "Reset password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t">
          <Link href="/login" className="text-sm underline-offset-4 hover:underline">
            Sign in
          </Link>
        </CardFooter>
      </ClientOnly>
    </Card>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <Card className="p-8">
          <LottieLoader label="Loading reset form..." size={80} />
        </Card>
      }
    >
      <ResetFormInner />
    </Suspense>
  );
}
