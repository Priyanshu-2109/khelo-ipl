import Image from "next/image";

export function KheloLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/kheloipl-logo.png"
      alt="Khelo IPL"
      width={140}
      height={140}
      className={className}
      priority
    />
  );
}
