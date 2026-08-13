import { createClient } from "@supabase/supabase-js";
import { publishScheduledPost } from "./lib/instagram-publish.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv(variable) {
  if (!process.env[variable]) {
    console.error(`Missing required environment variable: ${variable}`);
    process.exit(1);
  }
}

assertEnv("SUPABASE_URL");
assertEnv("SUPABASE_SERVICE_ROLE_KEY");
assertEnv("META_APP_ID");
assertEnv("META_APP_SECRET");
assertEnv("META_GRAPH_VERSION");
assertEnv("API_BASE_URL");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function fetchReadyPosts() {
  const { data, error } = await supabase
    .from("posts_ready_to_publish")
    .select("*")
    .order("scheduled_time", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch ready posts: ${error.message}`);
  }

  console.log("[fetchReadyPosts] Fetched posts:", data?.length ?? 0);
  data?.forEach((post) => {
    console.log(
      "[fetchReadyPosts] Post ID:",
      post.id,
      "Platform:",
      post.platform,
      "Content payload:",
      JSON.stringify(post.content_payload, null, 2),
    );
  });

  return data ?? [];
}

async function markPostPublished(postId, externalId) {
  console.log(
    `[markPostPublished] Attempting to mark post ${postId} as published with external ID ${externalId}`,
  );
  const { error } = await supabase.rpc("mark_post_published", {
    post_id: postId,
    external_id: externalId,
  });

  if (error) {
    console.error(`[markPostPublished] RPC call failed for post ${postId}:`, error);
    console.error(`[markPostPublished] Error details:`, JSON.stringify(error, null, 2));

    // Fallback: Try direct update if RPC fails
    console.log(`[markPostPublished] Attempting fallback direct update for post ${postId}`);
    const { error: updateError } = await supabase
      .from("scheduled_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", postId);

    if (updateError) {
      console.error(
        `[markPostPublished] Fallback direct update also failed for post ${postId}:`,
        updateError,
      );
      throw new Error(
        `Failed to mark post published (RPC and direct update both failed): ${error.message}`,
      );
    }

    console.log(`[markPostPublished] Fallback direct update succeeded for post ${postId}`);
  } else {
    console.log(`[markPostPublished] Successfully marked post ${postId} as published via RPC`);
  }
}

async function setSchedulerRunId(postId) {
  const jobId = `scheduler:${new Date().toISOString()}`;
  const { error } = await supabase
    .from("scheduled_posts")
    .update({ scheduler_job_id: jobId })
    .eq("id", postId);

  if (error) {
    console.warn(`Unable to set scheduler job id for post ${postId}: ${error.message}`);
  }
}

async function markPostFailed(postId, message) {
  const payload = {
    status: "failed",
    error_message: message,
    scheduler_job_id: `scheduler:error:${new Date().toISOString()}`,
  };
  const { error } = await supabase.from("scheduled_posts").update(payload).eq("id", postId);
  if (error) {
    console.error(`Failed to mark post ${postId} as failed: ${error.message}`);
  }
}

export async function runScheduler() {
  console.log("Scheduler started: checking for ready posts...");
  const posts = await fetchReadyPosts();

  if (posts.length === 0) {
    console.log("No scheduled posts are ready to publish.");
    return { processed: 0, failures: 0 };
  }

  let failureCount = 0;
  let successCount = 0;
  for (const post of posts) {
    console.log(`Processing post ${post.id} for user ${post.user_id} on ${post.platform}...`);

    let externalPostId = null;
    let publishSucceeded = false;

    try {
      await setSchedulerRunId(post.id);
      externalPostId = await publishScheduledPost(post);
      publishSucceeded = true;
      console.log(
        `[runScheduler] Instagram publishing succeeded for post ${post.id}, external ID: ${externalPostId}`,
      );

      // Critical: Even if status update fails, the post is published on Instagram
      // We must NOT mark it as failed
      try {
        await markPostPublished(post.id, externalPostId);
        console.log(`Published scheduled post ${post.id} (external id: ${externalPostId}).`);
        successCount += 1;
      } catch (statusUpdateError) {
        // Publishing succeeded but status update failed
        console.error(
          `[runScheduler] CRITICAL: Post ${post.id} was published to Instagram (external ID: ${externalPostId}) but status update failed:`,
          statusUpdateError,
        );
        console.error(
          `[runScheduler] Post is LIVE on Instagram but dashboard may show incorrect status`,
        );
        // Do NOT mark as failed - the post is successfully published
        successCount += 1;
      }
    } catch (error) {
      failureCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error publishing scheduled post ${post.id}: ${message}`);

      // Only mark as failed if actual publishing failed
      if (!publishSucceeded) {
        await markPostFailed(post.id, message);
      } else {
        console.error(
          `[runScheduler] ERROR: Post ${post.id} was published (external ID: ${externalPostId}) but an error occurred after: ${message}`,
        );
      }
    }
  }

  console.log(
    `[runScheduler] Summary: ${successCount} succeeded, ${failureCount} failed out of ${posts.length} posts`,
  );

  if (failureCount > 0) {
    console.error(`${failureCount} scheduled post(s) failed.`);
  } else {
    console.log("All ready scheduled posts processed successfully.");
  }

  return { processed: posts.length, failures: failureCount, successes: successCount };
}

const isDirectRun = process.argv[1]?.endsWith("scheduler.js");

if (isDirectRun) {
  runScheduler()
    .then(({ failures }) => {
      if (failures > 0) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
