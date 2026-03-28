"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { KheloLogo } from "@/components/khelo-logo";
import { ClientOnly } from "@/components/client-only";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3.1l3 2.3c1.8-1.7 2.8-4.2 2.8-7.1 0-.7-.1-1.4-.2-2H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.6 0 4.7-.8 6.2-2.3l-3-2.3c-.8.6-1.9 1-3.2 1-2.4 0-4.5-1.6-5.2-3.9l-3.1 2.4C5.2 20 8.3 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.8 14.5c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.7 8.3C3.1 9.5 2.8 11 2.8 12.6s.3 3.1.9 4.3l3.1-2.4z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.8c1.4 0 2.6.5 3.6 1.4l2.7-2.7C16.7 4 14.6 3.2 12 3.2c-3.7 0-6.8 2-8.3 4.9l3.1 2.4c.7-2.3 2.8-3.7 5.2-3.7z"
      />
    </svg>
  );
}

function FormSkeleton() {
  return (
    <CardContent className="space-y-4 py-6">
      <div className="bg-muted h-10 animate-pulse rounded-lg" />
      <div className="bg-muted h-10 animate-pulse rounded-lg" />
      <div className="bg-muted h-10 animate-pulse rounded-lg" />
    </CardContent>
  );
}

export function LoginForm({ showGoogle }: { showGoogle: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-xl ring-1 ring-navy/5">
      <CardHeader className="flex flex-col items-center space-y-3 pb-2">
        <KheloLogo className="size-24 object-contain sm:size-28" />
        <div className="text-center">
          <h1 className="text-foreground text-xl font-bold tracking-tight">
            Welcome to Khelo IPL
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to your account
          </p>
        </div>
      </CardHeader>
      <ClientOnly fallback={<FormSkeleton />}>
        <CardContent className="space-y-4">
          {showGoogle && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full border-navy/20"
                onClick={() => signIn("google", { callbackUrl })}
              >
                <GoogleIcon />
                Continue with Google
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@example.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
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
                  onClick={() => setShow(!show)}
                  aria-label="Toggle password visibility"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="text-right text-sm">
              <Link
                href="/forgot-password"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          <p className="text-muted-foreground text-center text-sm">
            New here?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </ClientOnly>
    </Card>
  );
}
