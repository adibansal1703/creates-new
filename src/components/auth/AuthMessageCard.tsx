import { Link } from "@tanstack/react-router";
import { Mail, MailCheck, UserX } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";

type AuthMessageCardProps = {
  variant: "verify-email" | "email-exists" | "no-account";
  email?: string;
};

export function AuthMessageCard({ variant, email }: AuthMessageCardProps) {
  if (variant === "verify-email") {
    return (
      <AuthLayout title="Check your email" subtitle="Verification email sent" footer={null}>
        <div className="text-center space-y-4">
          <MailCheck className="mx-auto size-12 text-primary" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Verification email sent. Please verify your email before accessing your account. After
            clicking the link you will be signed in or prompted to log in.
            {email && (
              <>
                <br />
                <span className="text-foreground font-medium">{email}</span>
              </>
            )}
          </p>
          <Button className="w-full bg-gradient-brand border-0 hover:opacity-90" asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (variant === "email-exists") {
    return (
      <AuthLayout title="Account exists" subtitle="This email is already registered" footer={null}>
        <div className="text-center space-y-4">
          <Mail className="mx-auto size-12 text-primary" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            An account already exists with this email address. Please log in instead.
          </p>
          <Button className="w-full bg-gradient-brand border-0 hover:opacity-90" asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="No account found" subtitle="Create an account to continue" footer={null}>
      <div className="text-center space-y-4">
        <UserX className="mx-auto size-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          No account found with this email address.
          {email && (
            <>
              <br />
              <span className="text-foreground font-medium">{email}</span>
            </>
          )}
        </p>
        <Button className="w-full bg-gradient-brand border-0 hover:opacity-90" asChild>
          <Link to="/signup">Create Account</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
