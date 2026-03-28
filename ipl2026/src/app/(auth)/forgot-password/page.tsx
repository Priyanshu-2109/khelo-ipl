"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import { ClientOnly } from "@/components/client-only";
import { KheloLogo } from "@/components/khelo-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function FormSkeleton() {
  return (
    <CardContent className="py-6">
      <div className="bg-muted h-10 animate-pulse rounded-lg" />
    </CardContent>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccess(true);
      if (res.debug_token && typeof window !== "undefined") {
        const path = `/reset-password?token=${encodeURIComponent(res.debug_token)}`;
        console.info("[Khelo IPL] Reset token (dev):", res.debug_token);
        console.info("[Khelo IPL] Reset link:", `${window.location.origin}${path}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="flex flex-col items-center pb-2">
          <KheloLogo className="size-24 object-contain" />
          <div className="mt-2 text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-600">
              ✓
            </div>
            <h1 className="text-xl font-bold">Check your email</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              If an account exists for that address, we sent reset instructions.
              Check spam if nothing arrives in a few minutes.
            </p>
          </div>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader className="flex flex-col items-center space-y-2 pb-2">
        <KheloLogo className="size-24 object-contain" />
        <h1 className="text-xl font-bold tracking-tight">Forgot password?</h1>
        <p className="text-muted-foreground text-center text-sm">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </CardHeader>
      <ClientOnly fallback={<FormSkeleton />}>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
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
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t">
          <Link
            href="/login"
            className="text-muted-foreground text-sm hover:text-foreground"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </ClientOnly>
    </Card>
  );
}
