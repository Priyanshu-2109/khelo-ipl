"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Home, Settings2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return null;

  const isAdmin = user?.isAdmin ?? false;
  const profilePic =
    (user as { profilePicture?: string | null })?.profilePicture ||
    user?.image;

  const Item = ({
    href,
    label,
    active,
    children,
  }: {
    href: string;
    label: string;
    active: boolean;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      className={cn(
        "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[0.65rem] font-semibold transition-colors sm:min-h-14 sm:text-xs",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground active:text-foreground"
      )}
    >
      {children}
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="bg-card/95 supports-[backdrop-filter]:bg-card/90 fixed inset-x-0 bottom-0 z-50 flex border-t shadow-[0_-4px_20px_-4px_rgba(30,58,95,0.08)] backdrop-blur-md md:hidden">
      <Item href="/dashboard" label="Home" active={pathname === "/dashboard"}>
        <Home className="size-5 sm:size-6" strokeWidth={2} />
      </Item>
      {isAdmin && (
        <Item href="/admin" label="Admin" active={pathname === "/admin"}>
          <Settings2 className="size-5 sm:size-6" strokeWidth={2} />
        </Item>
      )}
      <Item
        href="/profile"
        label="Profile"
        active={pathname === "/profile"}
      >
        {profilePic ? (
          <Image
            src={profilePic}
            alt=""
            width={24}
            height={24}
            className="size-6 rounded-full object-cover ring-1 ring-border sm:size-7"
            unoptimized={
              profilePic.startsWith("data:") ||
              profilePic.includes("googleusercontent")
            }
          />
        ) : (
          <User className="size-5 sm:size-6" strokeWidth={2} />
        )}
      </Item>
    </nav>
  );
}
