import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { Card, CardContent } from "@/components/ui/card";
import { LottieLoader } from "@/components/ui/lottie-loader";

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
          <CardContent className="pt-4">
            <LottieLoader label="Loading login..." size={80} />
          </CardContent>
        </Card>
      }
    >
      <LoginForm showGoogle={showGoogle} />
    </Suspense>
  );
}
