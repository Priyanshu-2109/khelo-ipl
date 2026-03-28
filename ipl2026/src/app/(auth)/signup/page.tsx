import { SignupForm } from "./signup-form";

function googleOAuthConfigured() {
  return !!(
    process.env.AUTH_GOOGLE_ID?.trim() &&
    process.env.AUTH_GOOGLE_SECRET?.trim()
  );
}

export default function SignupPage() {
  return <SignupForm showGoogle={googleOAuthConfigured()} />;
}
