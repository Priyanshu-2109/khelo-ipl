import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Khelo IPL · Fantasy cricket",
  description:
    "Khelo IPL — fantasy cricket leaderboard, match scoring, and player profiles.",
  icons: { icon: "/kheloipl-logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} min-h-dvh font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
