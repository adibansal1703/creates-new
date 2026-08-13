import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PasswordFieldProps = {
  id: string;
  label?: string;
  labelExtra?: React.ReactNode;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function PasswordField({
  id,
  label,
  labelExtra,
  error,
  placeholder,
  autoComplete,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      {(label || labelExtra) && (
        <div className="flex items-center justify-between">
          {label ? <Label htmlFor={id}>{label}</Label> : <span />}
          {labelExtra}
        </div>
      )}
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn(
            "glass border-border/60 h-10 pr-10",
            error && "border-destructive",
            className,
          )}
          {...inputProps}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
