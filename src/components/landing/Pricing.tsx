import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const plans = [
  {
    name: "Starter",
    price: "₹0",
    period: "/14-day trial",
    desc: "Try every feature, no card required.",
    features: ["3 social accounts", "30 scheduled posts", "500 AI credits", "Basic analytics"],
    cta: "Start free",
  },
  {
    name: "Creator",
    price: "₹200",
    period: "/mo",
    desc: "For solo creators ready to scale.",
    features: [
      "10 social accounts",
      "Unlimited scheduling",
      "10,000 AI credits",
      "Trend Radar",
      "Full analytics",
      "Brand voice memory",
    ],
    cta: "Get Creator",
  },
  {
    name: "Agency",
    price: "₹500",
    period: "/mo",
    desc: "Multi-brand workspaces & white-label.",
    features: [
      "Unlimited accounts",
      "Unlimited posts",
      "50,000 AI credits",
      "Client workspaces",
      "White-label",
      "Priority support",
    ],
    cta: "Get Agency",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm text-primary font-medium">Pricing</p>
            <Badge className="text-xs bg-amber-500 hover:bg-amber-600">Coming Soon</Badge>
          </div>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
            Plans that scale with you
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {plans.map((p) => (
            <div key={p.name} className="relative glass rounded-3xl p-7">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <Button
                className="mt-6 w-full opacity-50 cursor-not-allowed"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Payments and subscriptions are currently under development.");
                }}
              >
                {p.cta}
              </Button>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="size-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
