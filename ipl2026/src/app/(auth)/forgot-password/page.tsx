"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword, resetPasswordWithOtp } from "@/lib/api";
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
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "verify" | "done">("request");

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setStep("verify");
      if (res.debug_otp) {
        setOtp(res.debug_otp);
        setMessage(`Dev OTP: ${res.debug_otp}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const resetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithOtp(email, otp, newPassword);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
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
              Password updated successfully. You can now sign in.
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
          {step === "request"
            ? "Enter your email and we will send an OTP."
            : "Enter OTP and your new password."}
        </p>
      </CardHeader>
      <ClientOnly fallback={<FormSkeleton />}>
        <CardContent>
          {step === "request" ? (
            <form onSubmit={requestOtp} className="space-y-4">
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
                {loading ? "Sending OTP…" : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={resetWithOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  placeholder="6-digit OTP"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  required
                  className="mt-1"
                />
              </div>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting…" : "Reset password"}
              </Button>
            </form>
          )}
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
