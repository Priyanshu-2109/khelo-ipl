"use client";

import { useMemo } from "react";
import type { PasswordRequirements } from "@/types";

export function usePasswordStrength(
  password: string,
  requirements: PasswordRequirements | null
) {
  return useMemo(() => {
    if (!requirements) {
      return {
        minLength: false,
        uppercase: false,
        lowercase: false,
        digit: false,
        special: false,
      };
    }
    return {
      minLength: password.length >= requirements.minLength,
      uppercase: requirements.requireUppercase
        ? /[A-Z]/.test(password)
        : true,
      lowercase: requirements.requireLowercase
        ? /[a-z]/.test(password)
        : true,
      digit: requirements.requireDigit ? /\d/.test(password) : true,
      special: requirements.requireSpecial
        ? /[!@#$%^&*(),.?":{}|<>]/.test(password)
        : true,
    };
  }, [password, requirements]);
}
