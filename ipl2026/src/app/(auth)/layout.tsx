import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteFooter } from "@/components/site-footer";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="from-background via-muted/20 to-navy/5 flex min-h-dvh flex-col bg-gradient-to-b">
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-3 sm:h-16 sm:px-4 lg:px-6">
        <Link href="/login" className="flex items-center gap-2">
          <Image
            src="/kheloipl-logo.png"
            alt="Khelo IPL"
            width={34}
            height={34}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="text-sm font-bold tracking-tight sm:text-base">Khelo IPL</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center p-4 pb-8 sm:p-6">
        <div className="w-full max-w-md flex-1 flex flex-col justify-center">{children}</div>
      </div>
      <SiteFooter />
    </div>
  );
}
