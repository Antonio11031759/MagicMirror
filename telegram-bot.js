// Telegraf-based Telegram bot for MagicMirror inbox
// Listens to channel_post updates and writes latest messages to JSON file

const fs = require("fs");
const path = require("path");
const { Telegraf } = require("telegraf");
const moment = require("moment-timezone");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const OUTPUT_JSON = process.env.OUTPUT_JSON || "/home/anton/mirror_inbox/inbox.json";
const MAX_ITEMS = Number(process.env.MAX_ITEMS || 3);
const TIMEZONE = process.env.TIMEZONE || "Europe/Berlin";

if (!BOT_TOKEN) {
  // eslint-disable-next-line no-console
  console.error("ERROR: BOT_TOKEN must be set in .env");
  process.exit(1);
}

// Ensure output directory exists
const outDir = path.dirname(OUTPUT_JSON);
try {
  fs.mkdirSync(outDir, { recursive: true });
} catch {}

// Load previously stored messages if present
function readExistingMessages() {
  try {
    if (fs.existsSync(OUTPUT_JSON)) {
      const raw = fs.readFileSync(OUTPUT_JSON, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to read existing inbox.json:", e.message);
  }
  return [];
}

function writeMessages(messages) {
  try {
    const toWrite = messages.slice(0, MAX_ITEMS);
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(toWrite, null, 2), "utf8");
    // eslint-disable-next-line no-console
    console.log(`Stored ${toWrite.length} messages to ${OUTPUT_JSON}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed writing inbox.json:", e.message);
  }
}

let messages = readExistingMessages();

const bot = new Telegraf(BOT_TOKEN, {
  handlerTimeout: 15_000
});

// Only interested in text channel posts
bot.on("channel_post", async (ctx) => {
  try {
    const post = ctx.channelPost;
    const text = post && (post.text || post.caption || "");
    if (!text) return; // ignore non-text posts (images/voice/etc.)

    // Try to resolve sender name if available
    // For channels, author_signature is present if enabled by channel settings
    const fromName = post.author_signature || (ctx.chat && ctx.chat.title) || "Unknown";

    const ts = moment().tz(TIMEZONE).format("HH:mm");
    const entry = { time: ts, from: fromName, text };

    messages = [entry, ...messages].slice(0, MAX_ITEMS);
    writeMessages(messages);

    // eslint-disable-next-line no-console
    console.log(`New channel post from ${fromName}: ${text.substring(0, 80)}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Handler error:", e.message);
  }
});

bot.launch().then(() => {
  // eslint-disable-next-line no-console
  console.log("Telegram bot is running. Add it as admin to your private channel.");
}).catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Failed to launch bot:", e.message);
  process.exit(1);
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));


