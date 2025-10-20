#!/usr/bin/env python3
import asyncio, json, os, sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.tl.types import User, Chat, Channel

load_dotenv()

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")
SESSION_NAME = os.getenv("SESSION_NAME", "mirror_inbox")
OUTPUT_JSON = os.getenv("OUTPUT_JSON", str(Path.home() / "mirror_inbox" / "inbox.json"))
MAX_ITEMS = int(os.getenv("MAX_ITEMS", "3"))
TIMEZONE = os.getenv("TIMEZONE", "Europe/Berlin")

if not API_ID or not API_HASH:
    print("ERROR: API_ID and API_HASH must be set in .env")
    sys.exit(1)

Path(OUTPUT_JSON).parent.mkdir(parents=True, exist_ok=True)

client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
messages: List[Dict[str, Any]] = []

def store_messages() -> None:
    to_write = messages[:MAX_ITEMS]
    try:
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(to_write, f, ensure_ascii=False, indent=2)
        print(f"Stored {len(to_write)} messages to {OUTPUT_JSON}", flush=True)
    except Exception as e:
        print(f"Failed writing {OUTPUT_JSON}: {e}", flush=True)

@client.on(events.NewMessage(incoming=True))
async def handler(event):
    try:
        sender = await event.get_sender()
        if isinstance(sender, User):
            if sender.first_name or sender.last_name:
                name = " ".join(filter(None, [sender.first_name, sender.last_name]))
            else:
                name = f"@{sender.username}" if sender.username else "Unknown"
        elif isinstance(sender, (Chat, Channel)):
            name = sender.title or "Channel"
        else:
            name = "Unknown"

        text = event.message.message or ""
        ts = datetime.now().strftime("%H:%M")
        entry = {"time": ts, "from": name, "text": text}

        # prepend new message; keep only MAX_ITEMS
        global messages
        messages = [entry] + messages
        messages = messages[:MAX_ITEMS]
        store_messages()
        print(f"New message from {name}: {text[:50]}...", flush=True)
    except Exception as e:
        print(f"Handler error: {e}", flush=True)

async def bootstrap():
    # Load last messages file if exists
    try:
        if Path(OUTPUT_JSON).exists():
            with open(OUTPUT_JSON, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                if isinstance(loaded, list):
                    # Ensure we have fields time/from/text
                    valid = []
                    for m in loaded[:MAX_ITEMS]:
                        valid.append({
                            "time": m.get("time", ""),
                            "from": m.get("from", ""),
                            "text": m.get("text", "")
                        })
                    global messages
                    messages = valid
                    print(f"Loaded {len(messages)} messages from file", flush=True)
    except Exception as e:
        print(f"Bootstrap read error: {e}", flush=True)

    print("Userbot is running. Press Ctrl+C to stop.", flush=True)
    await client.run_until_disconnected()

def main():
    loop = asyncio.get_event_loop()
    try:
        client.start()
        loop.run_until_complete(bootstrap())
    except KeyboardInterrupt:
        pass
    finally:
        try:
            loop.run_until_complete(client.disconnect())
        except Exception:
            pass

if __name__ == "__main__":
    main()