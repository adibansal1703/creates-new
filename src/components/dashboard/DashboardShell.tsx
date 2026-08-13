import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  Home,
  LayoutDashboard,
  Link2,
  Send,
  Settings,
  Sparkles,
} from "lucide-react";
import { UserAccountMenu } from "@/components/layout/UserAccountMenu";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/ai-content", label: "AI Content Ideas", icon: Sparkles, exact: true },
  { to: "/dashboard/publishing", label: "Multi-Platform Publishing", icon: Send, exact: false },
  { to: "/dashboard/scheduler", label: "Smart Scheduler", icon: CalendarClock, exact: false },
  { to: "/dashboard/accounts", label: "Connected Accounts", icon: Link2, exact: false },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-80 flex-col border-r border-border/60 bg-card shrink-0">
          <div className="p-10 border-b border-border/60 space-y-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-sans"
            >
              <Home className="size-4" />
              Back to home page
            </Link>
          </div>
          <nav className="flex-1 p-8 space-y-2 border-b border-amber-900/30">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-6 py-3.5 text-sm font-medium transition-all duration-300 ease-out",
                    active
                      ? "bg-primary text-primary-foreground shadow-subtle"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-8 border-t border-amber-900/30">
            <UserAccountMenu className="w-full justify-start" />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden border-b border-amber-900/30 bg-card sticky top-0 z-40 px-6 py-6">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-1">
                <Link
                  to="/"
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 font-sans"
                >
                  Home
                </Link>
                <UserAccountMenu compact />
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "shrink-0 rounded-xl px-5 py-2.5 text-xs font-medium transition-all duration-300 ease-out",
                      active
                        ? "bg-primary text-primary-foreground shadow-subtle"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 p-10 md:p-16 max-w-7xl w-full mx-auto border-t border-amber-900/30">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
