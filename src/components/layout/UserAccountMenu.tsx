import { Link } from "@tanstack/react-router";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { cn } from "@/lib/utils";

type UserAccountMenuProps = {
  className?: string;
  compact?: boolean;
};

export function UserAccountMenu({ className, compact = false }: UserAccountMenuProps) {
  const { signOut } = useAuth();
  const { displayName, email, initials, loading } = useUserProfile();

  if (loading) {
    return (
      <div className={cn("h-9 w-28 rounded-lg bg-muted/40 animate-pulse", className)} aria-hidden />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-auto gap-2 px-2 py-1.5 hover:bg-secondary",
            compact ? "px-1.5" : "pl-1.5 pr-2",
            className,
          )}
        >
          <Avatar className="size-8 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!compact && (
            <span className="hidden sm:flex flex-col items-start max-w-[140px]">
              <span className="text-sm font-medium truncate w-full text-left">{displayName}</span>
              <span className="text-[11px] text-muted-foreground truncate w-full text-left">
                {email}
              </span>
            </span>
          )}
          <ChevronDown className="size-4 text-muted-foreground hidden sm:block shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-medium">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <p className="mt-1 text-xs text-muted-foreground truncate">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="size-4" />
            Go to dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => signOut()}
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
