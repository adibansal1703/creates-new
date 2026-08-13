import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { ensureUserProfile, isEmailVerified } from "@/lib/auth-session";
import { getAuthCallbackUrl } from "@/lib/env";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    verified: search.verified === "1" || search.verified === true,
    verify: (search.verify as string) || undefined,
  }),
  head: () => ({
    meta: [{ title: "Log in — Creatory AI" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { verified, verify } = Route.useSearch();

  useEffect(() => {
    if (!authLoading && session?.user && isEmailVerified(session.user)) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [authLoading, session, navigate]);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (verified) {
      toast.success("Email verified successfully. Please log in.");
    }
    if (verify === "pending") {
      setAuthError("Please verify your email before logging in.");
    }
  }, [verified, verify]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured.");
      return;
    }

    setAuthError(null);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("email not confirmed")) {
        setAuthError("Please verify your email first. Check your inbox for the confirmation link.");
        return;
      }
      setAuthError("Incorrect email or password.");
      return;
    }

    if (authData.user && !isEmailVerified(authData.user)) {
      setAuthError("Please verify your email first. Check your inbox for the confirmation link.");
      return;
    }

    if (authData.user) {
      await ensureUserProfile(authData.user);
    }

    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  };

  const onForgotPassword = async () => {
    const email = getValues("email");
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset email sent.");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your Creatory AI workspace"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {verified && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            Email verified successfully. Please log in.
          </div>
        )}

        {authError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {authError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="glass border-border/60 h-10"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <PasswordField
          id="password"
          label="Password"
          labelExtra={
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={onForgotPassword}
            >
              Forgot password?
            </button>
          }
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-brand border-0 hover:opacity-90 h-10"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
