import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-lg p-12 md:p-16 text-center border border-border bg-card shadow-elevated">
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              From idea to viral. <span className="text-primary">Powered by AI.</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join 4,200+ brands using Creatory AI to ship content faster, smarter and on every
              platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" className="h-12 px-6">
                Start your free trial <ArrowRight className="ml-1 size-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6">
                Talk to sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
