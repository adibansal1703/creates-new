import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { completeInstagramOAuth } from "@/lib/api/instagram-oauth.functions";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/instagram/callback")({
  ssr: false,
  component: InstagramCallbackPage,
});

type SavedInstagramAccount = Awaited<ReturnType<typeof completeInstagramOAuth>>;

const inflightCallbacks = new Map<string, Promise<SavedInstagramAccount>>();

function redirectToConnectedAccounts() {
  window.location.replace("/dashboard/accounts?instagram=connected");
}

function InstagramCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

      if (oauthError) {
        if (mounted) setError(oauthError);
        return;
      }

      if (!code || !state) {
        if (mounted) {
          setError("Missing Instagram authorization code. Please try connecting again.");
        }
        return;
      }

      try {
        const supabase = getSupabase();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          if (mounted) {
            setError("You must be logged in to connect Instagram. Please log in and try again.");
          }
          return;
        }

        const callbackKey = `${state}:${code}`;
        let completion = inflightCallbacks.get(callbackKey);

        if (!completion) {
          completion = completeInstagramOAuth({
            data: {
              accessToken: session.access_token,
              code,
              state,
            },
          });
          inflightCallbacks.set(callbackKey, completion);
          completion.finally(() => {
            inflightCallbacks.delete(callbackKey);
          });
        }

        await completion;
        redirectToConnectedAccounts();
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Instagram connection failed.");
        }
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <p className="text-destructive font-medium">Instagram connection failed</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <a
            href="/dashboard/accounts"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to connected accounts
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Connecting your Instagram account…</p>
    </div>
  );
}
