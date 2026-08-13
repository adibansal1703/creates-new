import {
  getPasswordStrength,
  STRENGTH_COLORS,
  type PasswordStrength,
} from "@/lib/password-strength";
import { cn } from "@/lib/utils";

const LABELS: Record<PasswordStrength, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { label, percent } = getPasswordStrength(password);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className={cn("font-medium capitalize", label === "weak" && "text-destructive")}>
          {LABELS[label]}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
        <div
          className={cn("h-full transition-all", STRENGTH_COLORS[label])}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
