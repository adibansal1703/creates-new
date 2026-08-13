export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export type PasswordStrengthResult = {
  score: number;
  label: PasswordStrength;
  percent: number;
};

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: "weak", percent: 0 };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let label: PasswordStrength = "weak";
  if (score >= 5) label = "strong";
  else if (score >= 4) label = "good";
  else if (score >= 3) label = "fair";

  const percent = Math.min(100, Math.round((score / 6) * 100));

  return { score, label, percent };
}

export const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  weak: "bg-destructive",
  fair: "bg-orange-500",
  good: "bg-amber-400",
  strong: "bg-emerald-500",
};
