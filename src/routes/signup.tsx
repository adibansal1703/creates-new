import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { useAuth } from "@/hooks/use-auth";
import { ensureUserProfile, isEmailVerified } from "@/lib/auth-session";
import { getAuthCallbackUrl } from "@/lib/env";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    pending: search.pending === "1" || search.pending === true,
  }),
  head: () => ({
    meta: [{ title: "Create account — Creatory AI" }],
  }),
  component: SignupPage,
});

type SignupView = "form" | "verify" | "exists";

function SignupPage() {
  const navigate = useNavigate();
  const { pending } = Route.useSearch();
  const { session, loading: authLoading } = useAuth();
  const [view, setView] = useState<SignupView>("form");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (session?.user && isEmailVerified(session.user)) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    if (pending && session?.user?.email && !isEmailVerified(session.user)) {
      setSubmittedEmail(session.user.email);
      setView("verify");
    }
  }, [authLoading, session, pending, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", terms: false },
    mode: "onSubmit",
  });

  const password = watch("password");
  const termsAccepted = watch("terms");

  const onInvalid = (fieldErrors: FieldErrors<SignupFormValues>) => {
    const first = Object.values(fieldErrors).find((e) => e?.message);
    const msg = first?.message ?? "Please fix the errors below.";
    setFormError(msg);
    toast.error(msg);
  };

  const resendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Verification email sent again. Check your inbox.");
    setView("verify");
  };

  const onSubmit = async (data: SignupFormValues) => {
    setFormError(null);

    if (!isSupabaseConfigured) {
      setFormError("Supabase is not configured. Add .env and restart the dev server.");
      return;
    }

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
        data: { full_name: data.name.trim() },
      },
    });

    setSubmittedEmail(data.email.trim());

    if (error) {
      const msg = error.message.toLowerCase();

      if (
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("user already")
      ) {
        setView("exists");
        return;
      }

      if (msg.includes("database") || msg.includes("profiles") || msg.includes("trigger")) {
        setFormError(
          `${error.message} — Run supabase/migrations/20260402000000_fix_signup_trigger.sql in Supabase.`,
        );
        return;
      }

      setFormError(error.message);
      toast.error(error.message);
      return;
    }

    if (authData.user) {
      await ensureUserProfile(authData.user);
    }

    // Supabase may omit session when email already exists (identities: [])
    const identities = authData.user?.identities ?? [];
    if (authData.user && identities.length === 0) {
      setView("exists");
      return;
    }

    if (authData.session?.user && isEmailVerified(authData.session.user)) {
      toast.success("Account created!");
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    // Email confirmation off but signUp returned no session — sign in immediately
    if (!authData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (!signInError && signInData.session?.user && isEmailVerified(signInData.user)) {
        await ensureUserProfile(signInData.user);
        toast.success("Account created!");
        navigate({ to: "/dashboard", replace: true });
        return;
      }
    }

    setView("verify");
    toast.success("Account created! Check your email to verify before logging in.");
  };

  if (view === "verify") {
    return (
      <AuthLayout title="Check your email" subtitle="Verification email sent" footer={null}>
        <div className="text-center space-y-4 relative z-10">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Verification email sent. Please verify your email before accessing your account.
            {submittedEmail && (
              <>
                <br />
                <span className="text-foreground font-medium">{submittedEmail}</span>
              </>
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full glass"
            onClick={() => resendVerification(submittedEmail)}
          >
            Resend verification email
          </Button>
          <p className="text-xs text-muted-foreground">
            Open the verification link in{" "}
            <strong className="text-foreground">this same browser</strong> (where you signed up).
            Then you&apos;ll reach the dashboard, or log in if the link opened elsewhere.
          </p>
          <Link
            to="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full text-muted-foreground inline-flex justify-center",
            )}
          >
            Already verified? Log in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (view === "exists") {
    return (
      <AuthLayout title="Account exists" subtitle="This email is already registered" footer={null}>
        <div className="text-center space-y-4 relative z-10">
          <p className="text-sm text-muted-foreground leading-relaxed">
            An account already exists with this email. Try logging in, or resend verification.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full glass"
            onClick={() => resendVerification(submittedEmail)}
          >
            Resend verification email
          </Button>
          <Link
            to="/login"
            className={cn(
              buttonVariants(),
              "w-full bg-gradient-brand border-0 hover:opacity-90 inline-flex justify-center",
            )}
          >
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your 14-day free trial — no card required"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="space-y-4 relative z-10"
        noValidate
      >
        {formError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Alex Morgan"
            className="glass border-border/60 h-10"
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

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

        <div className="space-y-2">
          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrengthMeter password={password ?? ""} />
          <p className="text-xs text-muted-foreground">
            8+ chars, uppercase, lowercase, number & symbol (e.g. Creatory@123)
          </p>
        </div>

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="terms"
            checked={termsAccepted === true}
            onCheckedChange={(c) => setValue("terms", c === true, { shouldValidate: true })}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-normal leading-snug text-muted-foreground cursor-pointer"
          >
            I agree to the Terms of Service and Privacy Policy
          </Label>
        </div>
        {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}

        <Button
          type="submit"
          className="w-full bg-gradient-brand border-0 hover:opacity-90 h-11 cursor-pointer relative z-10"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
