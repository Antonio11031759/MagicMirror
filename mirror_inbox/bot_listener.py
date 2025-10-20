#!/usr/bin/env python3
import asyncio
import json
import os
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message


ABS_DIR = Path("/home/anton/mirror_inbox")
ENV_PATH = ABS_DIR / ".env"
DEFAULT_JSON = ABS_DIR / "inbox.json"


def ensure_dir_and_files():
    ABS_DIR.mkdir(parents=True, exist_ok=True)
    if not DEFAULT_JSON.exists():
        DEFAULT_JSON.write_text("[]", encoding="utf-8")


def atomic_write_json(target: Path, data_obj) -> None:
    tmp = target.with_suffix(target.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data_obj, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, target)


def now_hhmm() -> str:
    return datetime.now().strftime("%H:%M")


def load_env():
    if ENV_PATH.exists():
        load_dotenv(ENV_PATH)
    else:
        load_dotenv()


def read_messages(path: Path, max_items: int) -> list[dict]:
    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
        if isinstance(data, list):
            return data[:max_items]
    except Exception:
        pass
    return []


async def main() -> None:
    ensure_dir_and_files()
    load_env()

    bot_token = os.getenv("BOT_TOKEN")
    output_json = Path(os.getenv("OUTPUT_JSON", str(DEFAULT_JSON)))
    max_items = int(os.getenv("MAX_ITEMS", "3"))

    if not bot_token:
        print("ERROR: BOT_TOKEN must be set in .env", flush=True)
        return

    dp = Dispatcher()
    bot = Bot(token=bot_token)

    # in-memory cache
    messages = read_messages(output_json, max_items)

    @dp.message(F.text)
    async def handle_text(msg: Message):
        try:
            sender = msg.from_user
            name = ""
            if sender:
                parts = [sender.first_name or "", sender.last_name or ""]
                name = " ".join(p for p in parts if p).strip() or (sender.username and f"@{sender.username}") or "Unknown"
            else:
                name = "Unknown"

            text = msg.text or ""
            entry = {"time": now_hhmm(), "from": name, "text": text}

            nonlocal messages
            messages = [entry] + messages
            messages = messages[:max_items]

            atomic_write_json(output_json, messages)
            print(f"[{entry['time']}] {entry['from']}: {entry['text']}")
        except Exception as e:
            print(f"Handler error: {e}")

    print("Bot listener is running. Press Ctrl+C to stop.")
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass


