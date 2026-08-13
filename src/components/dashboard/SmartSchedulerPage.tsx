import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { scheduledPostsQueryKey } from "@/hooks/use-scheduled-posts";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { ScheduledPostsSection } from "@/components/dashboard/ScheduledPostsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scheduleMultiple } from "@/lib/api/scheduled-posts";
import { COMMON_TIMEZONES } from "@/lib/constants/timezones";
import {
  combineDateAndTime,
  getDefaultScheduleValues,
  minScheduleDateString,
} from "@/lib/scheduled-post-utils";
import { PUBLISHING_SESSION_KEY, type PublishingSession } from "@/lib/publishing/content-summary";

export function SmartSchedulerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const defaults = getDefaultScheduleValues();
  const [scheduleDate, setScheduleDate] = useState(defaults.date);
  const [scheduleTime, setScheduleTime] = useState(defaults.time);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [session, setSession] = useState<PublishingSession | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const raw = sessionStorage.getItem(PUBLISHING_SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PublishingSession;
        setSession(parsed);
      } catch (error) {
        console.error("[SmartSchedulerPage] Failed to parse session:", error);
        setSession(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data?.timezone) {
          setTimezone(data.timezone);
        }
      });
  }, [user]);

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!session?.platforms.length) {
        throw new Error("No content to schedule");
      }
      const scheduledTime = combineDateAndTime(scheduleDate, scheduleTime);
      if (scheduledTime.getTime() <= Date.now()) {
        throw new Error("Scheduled time must be in the future");
      }
      await scheduleMultiple({
        platforms: session.platforms,
        contentPayload: session.contentPayload,
        scheduledTime: scheduledTime.toISOString(),
        timezone,
      });
    },
    onSuccess: () => {
      sessionStorage.removeItem(PUBLISHING_SESSION_KEY);
      queryClient.invalidateQueries({ queryKey: scheduledPostsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-scheduled"] });
      setConfirmed(true);
      toast.success("Your post has been scheduled successfully.");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <CheckCircle2 className="mx-auto size-14 text-emerald-400" />
        <h1 className="text-2xl font-semibold">Your post has been scheduled successfully.</h1>
        <p className="text-muted-foreground text-sm">
          You will receive an email confirmation. Your post will publish at the scheduled time.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/publishing">Create another post</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Smart Scheduler</h1>
        <p className="mt-1 text-muted-foreground">Pick when your content goes live</p>
      </div>

      {session && (
        <div className="rounded-lg p-6 border border-border bg-card shadow-subtle max-w-lg space-y-4">
          <p className="text-sm text-muted-foreground">
            Scheduling for:{" "}
            <span className="text-foreground font-medium">{session.platforms.join(", ")}</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                min={minScheduleDateString()}
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            disabled={scheduleMutation.isPending}
            onClick={() => scheduleMutation.mutate()}
          >
            {scheduleMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Scheduling…
              </>
            ) : (
              "Confirm schedule"
            )}
          </Button>
        </div>
      )}

      {!session && (
        <div className="rounded-lg p-6 border border-border bg-card shadow-subtle text-sm text-muted-foreground">
          No pending content.{" "}
          <Link to="/dashboard/publishing" className="text-primary underline">
            Create a post
          </Link>{" "}
          and choose Schedule Post.
        </div>
      )}

      <ScheduledPostsSection variant="page" />
    </div>
  );
}
