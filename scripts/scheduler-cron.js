import { runScheduler } from "./scheduler.js";

const INTERVAL_MS = Number(process.env.SCHEDULER_INTERVAL_MS ?? 60_000);

console.log(`Scheduler cron started. Running every ${INTERVAL_MS}ms.`);

async function tick() {
  try {
    await runScheduler();
  } catch (error) {
    console.error("Scheduler tick failed:", error instanceof Error ? error.message : error);
  }
}

await tick();
const intervalId = setInterval(tick, INTERVAL_MS);

// Keep the process alive by preventing the interval from being garbage collected
process.on("SIGINT", () => {
  clearInterval(intervalId);
  process.exit(0);
});
