import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { completeAuthFromUrl } from "@/lib/auth-session";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { session, verified, emailConfirmedNoSession } = await completeAuthFromUrl();

        if (cancelled) return;

        if (session?.user && verified) {
          toast.success("Email verified! Welcome to Creatory AI.");
          navigate({ to: "/dashboard", replace: true });
          return;
        }

        if (session?.user && !verified) {
          navigate({ to: "/signup", search: { pending: "1" }, replace: true });
          return;
        }

        if (emailConfirmedNoSession) {
          toast.success(
            "Email verified! Please log in with the same browser you used to sign up, or log in here.",
            { duration: 8000 },
          );
          navigate({
            to: "/login",
            search: { verified: "1" },
            replace: true,
          });
          return;
        }

        navigate({
          to: "/login",
          search: { verified: "1" },
          replace: true,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Verification failed");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    const isPkce =
      error.toLowerCase().includes("code verifier") || error.toLowerCase().includes("pkce");

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <p className="text-destructive font-medium">
            {isPkce ? "Open the link in the same browser" : "Verification error"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPkce
              ? "Sign up and click the email link in this same browser (Chrome, Edge, etc.). If you already verified, log in below."
              : error}
          </p>
          <a
            href="/login?verified=1"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Confirming your email…</p>
    </div>
  );
}
