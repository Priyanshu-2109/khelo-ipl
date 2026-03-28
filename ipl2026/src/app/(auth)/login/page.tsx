import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Card, CardContent } from "@/components/ui/card";

function googleOAuthConfigured() {
  return !!(
    process.env.AUTH_GOOGLE_ID?.trim() &&
    process.env.AUTH_GOOGLE_SECRET?.trim()
  );
}

export default function LoginPage() {
  const showGoogle = googleOAuthConfigured();

  return (
    <Suspense
      fallback={
        <Card className="p-10">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      }
    >
      <LoginForm showGoogle={showGoogle} />
    </Suspense>
  );
}
