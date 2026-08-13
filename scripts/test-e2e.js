import { createClient } from "@supabase/supabase-js";

function assertEnv(name) {
  if (!process.env[name]) {
    console.error(`Missing environment variable: ${name}`);
    process.exit(1);
  }
}

assertEnv("SUPABASE_URL");
assertEnv("SUPABASE_SERVICE_ROLE_KEY");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log("E2E test started: creating scheduled post...");

  // pick an existing profile to attach the scheduled post to
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, email")
    .limit(1);

  if (pErr) {
    console.error("Failed to read profiles:", pErr.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.error("No profiles found in the database. Create a test user first.");
    process.exit(1);
  }

  const profile = profiles[0];

  const platform = "x";
  const content = "E2E test post - please ignore";
  const scheduledTime = new Date().toISOString(); // immediate

  const insertPayload = {
    user_id: profile.id,
    platform,
    content,
    content_payload: { [platform]: { content } },
    scheduled_time: scheduledTime,
    timezone: "UTC",
    status: "scheduled",
  };

  const { data: insertData, error: insertErr } = await supabase
    .from("scheduled_posts")
    .insert(insertPayload)
    .select()
    .single();

  if (insertErr) {
    console.error("Failed to insert scheduled post:", insertErr.message);
    process.exit(1);
  }

  const scheduledId = insertData.id;
  console.log("Inserted scheduled post id:", scheduledId);

  // call RPC to mark published (this mirrors scheduler behavior)
  const { error: rpcErr } = await supabase.rpc("mark_post_published", { post_id: scheduledId });
  if (rpcErr) {
    console.error("RPC mark_post_published failed:", rpcErr.message);
    process.exit(1);
  }

  // verify scheduled_posts row
  const { data: schedRows, error: schedErr } = await supabase
    .from("scheduled_posts")
    .select("id, status, published_at")
    .eq("id", scheduledId);

  if (schedErr) {
    console.error("Failed to query scheduled_posts:", schedErr.message);
    process.exit(1);
  }

  console.log("scheduled_posts row:", schedRows[0]);

  // verify published_posts row
  const { data: pubRows, error: pubErr } = await supabase
    .from("published_posts")
    .select("id, scheduled_post_id, published_at")
    .eq("scheduled_post_id", scheduledId);

  if (pubErr) {
    console.error("Failed to query published_posts:", pubErr.message);
    process.exit(1);
  }

  console.log("published_posts rows count:", pubRows.length);
  if (pubRows.length > 0) console.log("published_posts[0]:", pubRows[0]);

  // check notification_queue for post_published
  const { data: notifs, error: nErr } = await supabase
    .from("notification_queue")
    .select("id, type, payload, processed_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (nErr) {
    console.error("Failed to query notification_queue:", nErr.message);
    process.exit(1);
  }

  const publishedNotif = (notifs || []).find((n) => n.type === "post_published");
  console.log("Found post_published notification:", Boolean(publishedNotif));
  if (publishedNotif)
    console.log(
      "notification id:",
      publishedNotif.id,
      "processed_at:",
      publishedNotif.processed_at,
    );

  console.log("E2E test completed.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
