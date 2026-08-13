import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, FileText, Link2, CalendarClock, Send, CalendarPlus } from "lucide-react";
import { PlatformBadge } from "@/components/dashboard/PlatformBadge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchDashboardStats,
  fetchRecentPublished,
  fetchRecentScheduled,
} from "@/lib/api/dashboard";
import { supabase } from "@/lib/supabase";
import { formatScheduledDateTime } from "@/lib/scheduled-post-utils";

export function DashboardHome() {
  const { user } = useAuth();

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: Boolean(user?.id),
  });

  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    enabled: Boolean(user),
  });

  const recentScheduled = useQuery({
    queryKey: ["recent-scheduled"],
    queryFn: () => fetchRecentScheduled(5),
    enabled: Boolean(user),
  });

  const recentPublished = useQuery({
    queryKey: ["recent-published"],
    queryFn: () => fetchRecentPublished(5),
    enabled: Boolean(user),
  });

  const displayName =
    profile.data?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  const cards = [
    {
      label: "Connected Platforms",
      value: stats.data?.connectedPlatforms,
      icon: Link2,
      href: "/dashboard/accounts",
    },
    {
      label: "Scheduled Posts",
      value: stats.data?.scheduledPosts,
      icon: CalendarClock,
      href: "/dashboard/scheduler",
    },
    {
      label: "Published Posts",
      value: stats.data?.publishedPosts,
      icon: Send,
      href: "/dashboard",
    },
    {
      label: "Draft Posts",
      value: stats.data?.draftPosts,
      icon: FileText,
      href: "/dashboard/publishing",
    },
  ];

  const noAccounts = !stats.isLoading && stats.data?.connectedPlatforms === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {displayName}</h1>
        <p className="mt-1 text-muted-foreground">{user?.email} — here is your content overview</p>
      </div>

      {noAccounts && (
        <EmptyState
          icon={<Link2 className="size-8" />}
          title="No social accounts connected yet"
          description="Connect your first account to start publishing and scheduling content across platforms."
          action={{ label: "Connect your first account", to: "/dashboard/accounts" }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.href}>
            <Card className="hover:border-primary/50 transition-all duration-200 hover:shadow-medium h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                {stats.isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : stats.isError ? (
                  <span className="text-sm text-destructive">Error loading</span>
                ) : (
                  <span className="text-3xl font-medium">{card.value ?? 0}</span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg p-6 border border-border bg-card shadow-subtle">
          <h2 className="font-medium text-lg mb-4">Latest Scheduled Posts</h2>
          {recentScheduled.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}
          {recentScheduled.isError && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="size-4" /> Could not load scheduled posts
            </p>
          )}
          {!recentScheduled.isLoading &&
            !recentScheduled.isError &&
            recentScheduled.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No scheduled posts yet.{" "}
                <Link to="/dashboard/publishing" className="text-primary underline">
                  Create and schedule your first post
                </Link>
              </p>
            )}
          <ul className="space-y-3">
            {recentScheduled.data?.map((post) => (
              <li
                key={post.id}
                className="rounded-sm bg-secondary/50 p-4 space-y-2 border border-border"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformBadge platform={post.platform} />
                  <StatusBadge status={post.status} />
                </div>
                <p className="text-sm line-clamp-2 leading-relaxed">{post.content}</p>
                <p className="text-xs text-muted-foreground">
                  {formatScheduledDateTime(post.scheduled_time)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg p-6 border border-border bg-card shadow-subtle">
          <h2 className="font-medium text-lg mb-4">Latest Published Posts</h2>
          {recentPublished.isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}
          {!recentPublished.isLoading && recentPublished.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No published posts yet. Publish from{" "}
              <Link to="/dashboard/publishing" className="text-primary underline">
                Multi-Platform Publishing
              </Link>
            </p>
          )}
          <ul className="space-y-3">
            {recentPublished.data?.map((post) => (
              <li
                key={post.id}
                className="rounded-sm bg-secondary/50 p-4 space-y-2 border border-border"
              >
                <PlatformBadge platform={post.platform} />
                <p className="text-sm line-clamp-2 leading-relaxed">{post.content}</p>
                <p className="text-xs text-muted-foreground">
                  {formatScheduledDateTime(post.published_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/dashboard/publishing">
            <CalendarPlus className="size-4" />
            Create new post
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard/scheduler">View scheduler</Link>
        </Button>
      </div>
    </div>
  );
}
