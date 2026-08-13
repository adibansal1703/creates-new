import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creatory AI — Your AI Content Team" },
      {
        name: "description",
        content:
          "Creatory AI is the AI-powered social media operating system. Automate, schedule and analyze content across every platform from one futuristic dashboard.",
      },
      { property: "og:title", content: "Creatory AI — Your AI Content Team" },
      {
        property: "og:description",
        content: "Create once. Publish everywhere. From idea to viral — powered by AI.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
