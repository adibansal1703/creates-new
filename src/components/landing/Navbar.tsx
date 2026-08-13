import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { UserAccountMenu } from "@/components/layout/UserAccountMenu";
import { useUserProfile } from "@/hooks/use-user-profile";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { isAuthenticated, loading } = useUserProfile();

  return (
    <header className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto mt-4 max-w-6xl px-4 pointer-events-auto">
        <nav className="rounded-lg flex items-center justify-between px-5 py-3 relative gap-3 border border-border bg-card shadow-subtle">
          <Link to="/" className="flex items-center gap-2 shrink-0 relative z-10">
            <span className="font-semibold">Creatory AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground relative z-20">
            <a href="#features" className="hover:text-foreground transition">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-2 relative z-20 shrink-0">
            {loading ? (
              <div className="h-9 w-24 rounded-lg bg-muted/40 animate-pulse" aria-hidden />
            ) : isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={cn(buttonVariants({ size: "sm" }), "text-primary-foreground")}
                >
                  Dashboard
                </Link>
                <UserAccountMenu />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  search={{ verified: false, verify: undefined }}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hidden sm:inline-flex",
                  )}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  search={{ pending: false }}
                  className={cn(buttonVariants({ size: "sm" }), "text-primary-foreground")}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
