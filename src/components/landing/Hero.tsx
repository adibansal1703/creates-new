import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/use-user-profile";
import { cn } from "@/lib/utils";
import dashboardImg from "@/assets/dashboard-hero.jpg";

export function Hero() {
  const { isAuthenticated, displayName, loading } = useUserProfile();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="relative w-full">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-medium tracking-tight leading-[1.1] text-foreground">
              Your AI Content Team.
            </h1>
            <p className="mt-8 text-2xl md:text-3xl lg:text-4xl font-serif font-medium tracking-tight text-primary leading-tight">
              Create once. Publish everywhere.
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="mt-10 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed font-sans"
          >
            {isAuthenticated ? (
              <>
                Welcome back, <span className="text-foreground font-medium">{displayName}</span>.
                Continue managing your content from your dashboard.
              </>
            ) : (
              <>
                The AI-powered social media operating system for creators, agencies and brands.
                Automate, schedule and analyze across every platform — from one elegant dashboard.
              </>
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            {!loading &&
              (isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-14 px-9 text-base inline-flex items-center",
                  )}
                >
                  <LayoutDashboard className="mr-2 size-5" />
                  Open dashboard
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              ) : (
                <Link
                  to="/signup"
                  search={{ pending: false }}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-14 px-9 text-base inline-flex items-center",
                  )}
                >
                  Start free trial <ArrowRight className="ml-1 size-4" />
                </Link>
              ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="mt-6 text-sm text-muted-foreground font-sans"
          >
            {isAuthenticated
              ? "You're signed in • Visit the marketing site anytime from your dashboard"
              : "No credit card required • 14-day free trial • Cancel anytime"}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative mt-24 md:mt-32"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background z-10 pointer-events-none" />
          <div className="absolute -inset-12 bg-primary/5 blur-3xl rounded-full" />
          <div className="relative rounded-2xl p-4 shadow-elevated">
            <img
              src={dashboardImg}
              alt="Creatory AI dashboard preview"
              width={1600}
              height={1100}
              className="rounded-xl w-full h-auto"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
