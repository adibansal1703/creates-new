import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMTP_HOST = process.env.EMAIL_SMTP_HOST;
const SMTP_PORT = process.env.EMAIL_SMTP_PORT;
const SMTP_USER = process.env.EMAIL_SMTP_USER;
const SMTP_PASS = process.env.EMAIL_SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM;

function assertEnv(variable) {
  if (!process.env[variable]) {
    console.error(`Missing required environment variable: ${variable}`);
    process.exit(1);
  }
}

assertEnv("SUPABASE_URL");
assertEnv("SUPABASE_SERVICE_ROLE_KEY");
assertEnv("EMAIL_SMTP_HOST");
assertEnv("EMAIL_SMTP_PORT");
assertEnv("EMAIL_SMTP_USER");
assertEnv("EMAIL_SMTP_PASS");
assertEnv("EMAIL_FROM");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function buildNotificationMessage(notification, profile) {
  const preview = String(notification.payload?.content_preview ?? "");
  switch (notification.type) {
    case "welcome":
      return {
        subject: "Welcome to Creatory AI",
        text: `Hi ${profile.full_name ?? "there"},\n\nWelcome to Creatory AI! Your account is ready to use.\n\nThanks,\nThe Creatory AI team`,
      };
    case "email_verification":
      return {
        subject: "Please verify your email",
        text: `Hi ${profile.full_name ?? "there"},\n\nPlease verify your email to continue using Creatory AI.\n\nThanks,\nThe Creatory AI team`,
      };
    case "post_scheduled":
      return {
        subject: "Your post is scheduled",
        text: `Hi ${profile.full_name ?? "there"},\n\nYour post has been scheduled successfully.\n\nContent preview:\n${preview}\n\nThank you for using Creatory AI.`,
      };
    case "post_published":
      return {
        subject: "Your scheduled post was published",
        text: `Hi ${profile.full_name ?? "there"},\n\nYour post has been published successfully.\n\nContent preview:\n${preview}\n\nThank you for using Creatory AI.`,
      };
    default:
      return {
        subject: `Creatory AI Notification: ${notification.type}`,
        text: `Hi ${profile.full_name ?? "there"},\n\nYou have a new notification of type ${notification.type}.`,
      };
  }
}

async function fetchQueuedNotifications(limit = 50) {
  const { data, error } = await supabase
    .from("notification_queue")
    .select("id, type, payload, user_id, created_at")
    .is("processed_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return data ?? [];
}

async function fetchProfiles(userIds) {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  return (data ?? []).reduce((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {});
}

async function markNotificationProcessed(notificationId) {
  const { error } = await supabase
    .from("notification_queue")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    throw new Error(`Failed to mark notification processed: ${error.message}`);
  }
}

async function sendEmail(notification, profile) {
  const message = buildNotificationMessage(notification, profile);
  const mailOptions = {
    from: EMAIL_FROM,
    to: profile.email,
    subject: message.subject,
    text: message.text,
  };

  await transporter.sendMail(mailOptions);
}

async function run() {
  console.log("Email worker started: polling notification queue...");

  const notifications = await fetchQueuedNotifications();
  if (notifications.length === 0) {
    console.log("No queued notifications to process.");
    return;
  }

  const userIds = [...new Set(notifications.map((notification) => notification.user_id))];
  const profilesByUserId = await fetchProfiles(userIds);

  let sentCount = 0;
  for (const notification of notifications) {
    const profile = profilesByUserId[notification.user_id];
    if (!profile?.email) {
      console.error(`Skipping notification ${notification.id} because recipient email is missing.`);
      continue;
    }

    try {
      await sendEmail(notification, profile);
      await markNotificationProcessed(notification.id);
      sentCount += 1;
      console.log(`Sent notification ${notification.id} to ${profile.email}.`);
    } catch (error) {
      console.error(
        `Failed to send notification ${notification.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(`Email worker finished: ${sentCount}/${notifications.length} notifications sent.`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
