# ЧЕК-ЛИСТ УСТАНОВКИ TELEGRAM ИНТЕГРАЦИИ

## 1. ПОДГОТОВКА СИСТЕМЫ

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip
pip3 install --user telethon python-dotenv
```

## 2. УСТАНОВКА USERBOT

```bash
mkdir -p /home/anton/MagicMirror/modules/MMM-TelegramInbox
cd /home/anton/MagicMirror/modules/MMM-TelegramInbox
cp /path/to/userbot_daemon.py .
cp /path/to/env_config .env
```

## 3. ПЕРВЫЙ ЗАПУСК (ИНТЕРАКТИВНЫЙ ЛОГИН)

```bash
python3 userbot_daemon.py
# Ввести номер телефона и код подтверждения
```

## 4. НАСТРОЙКА SYSTEMD

```bash
sudo cp /path/to/mirror_inbox.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mirror_inbox.service
```

## 5. УСТАНОВКА МОДУЛЯ MAGICMIRROR

```bash
cd /home/anton/MagicMirror/modules
cp -r /path/to/MMM-TelegramInbox .
pm2 restart MagicMirror
```

## 6. НАСТРОЙКА CONFIG.JS

Добавить в `~/MagicMirror/config/config.js`:

```javascript
{
    module: "MMM-TelegramInbox",
    position: "bottom_right",
    config: {
        jsonPath: "/home/anton/MagicMirror/modules/MMM-TelegramInbox/inbox.json",
        pollInterval: 10000,
        maxItems: 3,
        maxChars: 100,
        header: "📱 Telegram"
    }
}
```

## 7. ПРОВЕРКА РАБОТЫ

```bash
sudo systemctl status mirror_inbox.service
journalctl -u mirror_inbox.service -f
cat /home/anton/MagicMirror/modules/MMM-TelegramInbox/inbox.json
pm2 logs MagicMirror
```

## ГОТОВО! 🎉

Система готова к работе:
- USERBOT слушает Telegram сообщения
- Сохраняет последние 3 сообщения в JSON
- MagicMirror отображает их в правом нижнем углу
- Формат: **Имя** — текст сообщения
- Обновление каждые 10 секунд
