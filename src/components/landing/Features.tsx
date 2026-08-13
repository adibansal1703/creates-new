import { motion } from "motion/react";
import { Calendar, Globe2 } from "lucide-react";

const features = [
  {
    icon: Globe2,
    title: "Multi-platform publishing",
    desc: "Instagram, LinkedIn, X, YouTube, Facebook — one composer, one click.",
  },
  {
    icon: Calendar,
    title: "Smart scheduler",
    desc: "Drag-and-drop calendar, queues, bulk uploads, timezone-aware publishing.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <p className="text-sm text-primary font-medium">Everything you need</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
            One platform. <span className="text-gradient">Every workflow.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop juggling 7 tools. Creatory AI replaces your scheduler, analytics suite, trend
            tracker and copywriter — with intelligent agents that learn your brand.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 group hover:border-primary/40 transition-all hover:-translate-y-1"
            >
              <div className="size-11 rounded-xl bg-gradient-brand grid place-items-center mb-4 group-hover:glow transition-shadow">
                <f.icon className="size-5 text-white" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
