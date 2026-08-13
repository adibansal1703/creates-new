import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; to?: string; onClick?: () => void };
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("glass rounded-2xl p-10 text-center border border-border/60", className)}>
      <div className="mx-auto flex size-12 items-center justify-center text-muted-foreground/60">
        {icon}
      </div>
      <p className="mt-4 font-medium">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <Button
          className="mt-6 bg-gradient-brand border-0 hover:opacity-90"
          asChild={Boolean(action.to)}
        >
          {action.to ? (
            <Link to={action.to}>{action.label}</Link>
          ) : (
            <button type="button" onClick={action.onClick}>
              {action.label}
            </button>
          )}
        </Button>
      )}
    </div>
  );
}
