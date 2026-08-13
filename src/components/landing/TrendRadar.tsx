import { motion } from "motion/react";
import { TrendingUp, Hash, Eye, Flame } from "lucide-react";

const trends = [
  { tag: "#AIagents", score: 98, growth: "+412%", platform: "X" },
  { tag: "#ContentOps", score: 87, growth: "+221%", platform: "LinkedIn" },
  { tag: "#ShortFormReels", score: 94, growth: "+318%", platform: "Instagram" },
  { tag: "#VibeCoding", score: 91, growth: "+267%", platform: "YouTube" },
];

export function TrendRadar() {
  return (
    <section id="trends" className="relative py-28">
      <div className="absolute inset-0 bg-hero-glow opacity-50 pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-4 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-sm text-primary font-medium flex items-center gap-2">
            <Flame className="size-4" /> AI Trend Radar
          </p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight">
            Catch trends <span className="text-gradient">before they go viral.</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            Our radar scans millions of posts in real time. Get niche-specific topic
            recommendations, hashtag forecasts and competitor alerts — turned into ready-to-publish
            drafts by your AI agents.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Real-time viral content discovery",
              "Niche & competitor monitoring",
              "Engagement forecasting with virality score",
              "Auto-generated drafts from trends",
            ].map((x) => (
              <li key={x} className="flex items-center gap-2 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-gradient-brand" /> {x}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-6 glow-blue"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-lg bg-gradient-brand grid place-items-center">
                <TrendingUp className="size-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Live trends</p>
                <p className="text-xs text-muted-foreground">Updated 12s ago</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
              ● Streaming
            </span>
          </div>
          <div className="space-y-3">
            {trends.map((t, i) => (
              <motion.div
                key={t.tag}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-3">
                  <Hash className="size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t.tag}</p>
                    <p className="text-xs text-muted-foreground">{t.platform}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-400 font-medium">{t.growth}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="size-3" /> {t.score}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
