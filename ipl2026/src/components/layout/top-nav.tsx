"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LogIn, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = !!session?.user?.isAdmin;

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4 lg:px-6">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/kheloipl-logo.png"
            alt="Khelo IPL"
            width={34}
            height={34}
            className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
            priority
          />
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-bold tracking-tight sm:text-base">
              Khelo IPL
            </p>
            <p className="text-muted-foreground hidden truncate text-xs sm:block">
              Fantasy leaderboard
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                active={pathname === link.href}
              />
            ))}
          </nav>

          {!session?.user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/admin"
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "hidden sm:inline-flex"
                )}
              >
                <Shield className="size-3.5" />
                Admin
              </Link>
              <Link href="/login" className={buttonVariants({ size: "sm" })}>
                <LogIn className="size-3.5" />
                Login
              </Link>
            </div>
          ) : null}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
