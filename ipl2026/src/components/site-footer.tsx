export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border/70 text-muted-foreground mt-auto border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-1 px-2 py-4 text-center text-[0.72rem] sm:flex-row sm:px-0 sm:text-left sm:text-xs">
        <p className="font-medium text-foreground/90">Khelo IPL</p>
        <p>Developed by - PRIYANSHU CHANIYARA</p>
        <p>© {year} All rights reserved</p>
      </div>
    </footer>
  );
}
