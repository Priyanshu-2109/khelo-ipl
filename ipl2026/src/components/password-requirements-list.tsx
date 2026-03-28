"use client";

import { cn } from "@/lib/utils";
import type { PasswordRequirements } from "@/types";

type Strength = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  special: boolean;
};

export function PasswordRequirementsList({
  requirements,
  strength,
}: {
  requirements: PasswordRequirements;
  strength: Strength;
}) {
  const rows: { ok: boolean; label: string }[] = [
    {
      ok: strength.minLength,
      label: `At least ${requirements.minLength} characters`,
    },
  ];
  if (requirements.requireUppercase) {
    rows.push({ ok: strength.uppercase, label: "One uppercase letter" });
  }
  if (requirements.requireLowercase) {
    rows.push({ ok: strength.lowercase, label: "One lowercase letter" });
  }
  if (requirements.requireDigit) {
    rows.push({ ok: strength.digit, label: "One number" });
  }
  if (requirements.requireSpecial) {
    rows.push({
      ok: strength.special,
      label: "One special character (!@#$%^&*...)",
    });
  }

  return (
    <div className="bg-muted/50 space-y-1.5 rounded-lg border p-3 text-sm">
      <p className="text-muted-foreground font-medium">Password must contain:</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li
            key={r.label}
            className={cn(
              "flex items-center gap-2",
              r.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            )}
          >
            <span className="font-mono text-xs">{r.ok ? "✓" : "○"}</span>
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
