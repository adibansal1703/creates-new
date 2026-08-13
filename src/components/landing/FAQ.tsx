import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Which platforms do you support?",
    a: "Instagram, Facebook, LinkedIn, YouTube and X (Twitter). More are rolling out monthly.",
  },
  {
    q: "How do AI credits work?",
    a: "Each plan includes monthly AI credits used for generation, trend analysis and agent runs. Top up anytime.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your billing dashboard — no questions asked, no hidden fees.",
  },
  {
    q: "Do you offer white-label for agencies?",
    a: "Yes, the Agency plan includes white-label dashboards, custom domains and client workspaces.",
  },
  {
    q: "Is my data secure?",
    a: "Tokens are encrypted at rest. We're GDPR-friendly with audit logs and role-based access control.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-sm text-primary font-medium">FAQ</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
            Questions, answered
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 glass rounded-2xl px-6">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-border">
              <AccordionTrigger className="text-left hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
