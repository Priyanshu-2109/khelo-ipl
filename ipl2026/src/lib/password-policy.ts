export const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

const MIN_LENGTH = Number(process.env.PASSWORD_MIN_LENGTH ?? 8);
const REQ_UPPER = process.env.PASSWORD_REQUIRE_UPPERCASE !== "false";
const REQ_LOWER = process.env.PASSWORD_REQUIRE_LOWERCASE !== "false";
const REQ_DIGIT = process.env.PASSWORD_REQUIRE_DIGIT !== "false";
const REQ_SPECIAL = process.env.PASSWORD_REQUIRE_SPECIAL !== "false";

export function validatePassword(password: string): { ok: true } | { ok: false; message: string } {
  if (password.length < MIN_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_LENGTH} characters long` };
  }
  if (REQ_UPPER && !/[A-Z]/.test(password)) {
    return { ok: false, message: "Password must contain at least one uppercase letter" };
  }
  if (REQ_LOWER && !/[a-z]/.test(password)) {
    return { ok: false, message: "Password must contain at least one lowercase letter" };
  }
  if (REQ_DIGIT && !/\d/.test(password)) {
    return { ok: false, message: "Password must contain at least one number" };
  }
  if (REQ_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      ok: false,
      message: "Password must contain at least one special character (!@#$%^&*...)",
    };
  }
  return { ok: true };
}

export function passwordRequirementsResponse() {
  return {
    minLength: MIN_LENGTH,
    requireUppercase: REQ_UPPER,
    requireLowercase: REQ_LOWER,
    requireDigit: REQ_DIGIT,
    requireSpecial: REQ_SPECIAL,
  };
}
