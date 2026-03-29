"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

type LottieLoaderProps = {
  label?: string;
  size?: number;
};

export function LottieLoader({
  label = "Loading...",
  size = 96,
}: LottieLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-6">
      <DotLottieReact
        src="https://lottie.host/be8f3e28-cd45-4532-86e9-1e12b762a8d8/z8BzalgWA4.lottie"
        animationId="12345"
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
