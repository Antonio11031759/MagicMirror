#!/usr/bin/env bash
set -euo pipefail

USER_HOME="/home/anton"
WORK_DIR="$USER_HOME/mirror_inbox"
MM_DIR="$USER_HOME/MagicMirror"

echo "==> Installing dependencies"
sudo apt update -y
sudo apt install -y python3 python3-pip
pip3 install --user --break-system-packages telethon python-dotenv "qrcode[pil]"

echo "==> Preparing directories"
mkdir -p "$WORK_DIR"
chmod 700 "$WORK_DIR"

echo "==> Creating .env if missing"
if [ ! -f "$WORK_DIR/.env" ]; then
  cat > "$WORK_DIR/.env" << 'EOF'
API_ID=
API_HASH=
SESSION_NAME=mirror_inbox
OUTPUT_JSON=/home/anton/mirror_inbox/inbox.json
MAX_ITEMS=3
TZ=Europe/Berlin
ALLOW_USERS=
EOF
  chmod 600 "$WORK_DIR/.env"
  echo "Edit $WORK_DIR/.env and set API_ID/API_HASH before starting."
fi

echo "==> Placing systemd service"
sudo cp "$MM_DIR/mirror_inbox.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mirror_inbox.service

echo "==> Done. Start with: sudo systemctl start mirror_inbox.service"


