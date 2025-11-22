Create .env in this directory with:
BOT_TOKEN=your_bot_token_here
OUTPUT_JSON=/home/anton/MagicMirror/inbox.json
MAX_ITEMS=3

Install dependencies:
pip3 install --user aiogram python-dotenv

Run:
python3 /home/anton/MagicMirror/mirror_inbox/bot_listener.py

Or setup as systemd service:
sudo cp ../mirror_inbox.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mirror_inbox.service

