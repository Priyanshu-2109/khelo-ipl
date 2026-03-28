import { BottomNav } from "@/components/layout/bottom-nav";
import { TopNav } from "@/components/layout/top-nav";
import { SiteFooter } from "@/components/site-footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background flex min-h-dvh flex-col pb-[4.75rem] md:pb-0">
      <TopNav />
      <div className="flex flex-1 flex-col">{children}</div>
      <div className="mt-auto px-3 pb-2 sm:px-4">
        <SiteFooter />
      </div>
      <BottomNav />
    </div>
  );
}
