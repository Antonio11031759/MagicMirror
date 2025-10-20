#!/usr/bin/env python3
import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError
import qrcode
import qrcode.image.pil


def atomic_write_json(target_path: Path, data_obj) -> None:
    tmp_path = target_path.with_suffix(target_path.suffix + ".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data_obj, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_path, target_path)


def ensure_permissions(path: Path, mode: int = 0o600) -> None:
    try:
        os.chmod(path, mode)
    except Exception:
        pass


def load_env(env_path: Path | None) -> None:
    if env_path and env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv()


def get_now_string(tz_name: str) -> str:
    try:
        # Use zoneinfo if available (Python 3.9+), fallback to naive
        from zoneinfo import ZoneInfo

        return datetime.now(ZoneInfo(tz_name)).strftime("%H:%M")
    except Exception:
        return datetime.now().strftime("%H:%M")


async def run_userbot() -> None:
    # Determine work directory
    default_dir = Path("/home/anton/mirror_inbox")
    work_dir = Path(os.getenv("INBOX_DIR", str(default_dir)))
    work_dir.mkdir(parents=True, exist_ok=True)

    # Load env from work dir first
    load_env(work_dir / ".env")

    api_id = os.getenv("API_ID")
    api_hash = os.getenv("API_HASH")
    output_json = Path(os.getenv("OUTPUT_JSON", str(work_dir / "inbox.json")))
    max_items = int(os.getenv("MAX_ITEMS", "3"))
    timezone = os.getenv("TZ", os.getenv("TIMEZONE", "Europe/Berlin"))
    allow_users_raw = os.getenv("ALLOW_USERS", "")
    allow_users = [u.strip().lower() for u in allow_users_raw.split(",") if u.strip()] if allow_users_raw else []

    if not api_id or not api_hash:
        print("ERROR: API_ID and API_HASH must be set in .env", flush=True)
        sys.exit(1)

    # Prepare session path inside work_dir
    session_name = os.getenv("SESSION_NAME", "mirror_inbox")
    session_path = work_dir / f"{session_name}.session"

    # File permissions
    if (work_dir / ".env").exists():
        ensure_permissions(work_dir / ".env")

    # Ensure JSON dir exists
    output_json.parent.mkdir(parents=True, exist_ok=True)

    # Load existing messages
    messages: list[dict[str, str]] = []
    try:
        if output_json.exists():
            loaded = json.loads(output_json.read_text(encoding="utf-8"))
            if isinstance(loaded, list):
                # normalize
                for m in loaded[:max_items]:
                    messages.append({
                        "time": str(m.get("time", "")),
                        "from": str(m.get("from", "")),
                        "text": str(m.get("text", ""))
                    })
    except Exception as e:
        print(f"Bootstrap read error: {e}", flush=True)

    # Client
    client = TelegramClient(str(session_path), int(api_id), api_hash)

    async def ensure_qr_login() -> None:
        await client.connect()
        if await client.is_user_authorized():
            return
        try:
            qr_login = await client.qr_login()
        except SessionPasswordNeededError:
            print("Two-factor password is set; QR login cannot proceed.", flush=True)
            sys.exit(1)

        # Render QR to terminal and save PNG in work_dir for convenience
        qr_png_path = work_dir / "login_qr.png"
        try:
            img = qrcode.make(qr_login.url, image_factory=qrcode.image.pil.PilImage)
            img.save(qr_png_path)
            print(f"QR saved to: {qr_png_path}", flush=True)
        except Exception as e:
            print(f"Failed to save QR PNG: {e}", flush=True)

        try:
            import qrcode.console_scripts  # type: ignore
        except Exception:
            pass
        try:
            qr = qrcode.QRCode(border=1)
            qr.add_data(qr_login.url)
            qr.make(fit=True)
            qr.print_ascii(invert=True)
        except Exception:
            print("Scan QR from saved PNG.", flush=True)

        print("Scan this QR with Telegram (Settings → Devices → Link Desktop Device)", flush=True)

        while True:
            try:
                await qr_login.wait(30)
                break
            except asyncio.TimeoutError:
                print("Waiting for QR scan...", flush=True)

        # Set strict permissions on created session files
        for f in work_dir.glob(f"{session_name}.session*"):
            ensure_permissions(f)

    @client.on(events.NewMessage(incoming=True))
    async def handler(event):
        try:
            if not event.is_private:
                return  # only direct messages (DM)

            sender = await event.get_sender()
            username = (getattr(sender, "username", None) or "").lower()
            if allow_users and username not in allow_users:
                return

            # derive sender name
            if getattr(sender, "first_name", None) or getattr(sender, "last_name", None):
                full_name = " ".join([x for x in [sender.first_name, sender.last_name] if x])
            else:
                full_name = f"@{sender.username}" if sender and sender.username else "Unknown"

            text = event.message.message or ""
            if not text:
                return  # ignore non-text

            ts = get_now_string(timezone)
            entry = {"time": ts, "from": full_name, "text": text}

            nonlocal messages
            messages = [entry] + messages
            messages = messages[:max_items]

            try:
                atomic_write_json(output_json, messages)
                print(f"Stored {len(messages)} messages → {output_json}", flush=True)
            except Exception as e:
                print(f"Failed writing inbox: {e}", flush=True)
        except Exception as e:
            print(f"Handler error: {e}", flush=True)

    await ensure_qr_login()
    print("Userbot is running. Press Ctrl+C to stop.", flush=True)
    await client.run_until_disconnected()


def main() -> None:
    try:
        asyncio.run(run_userbot())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()


