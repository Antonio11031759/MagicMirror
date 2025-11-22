# Инструкция по запуску Telegram бота на Raspberry Pi

## Важно!
В проекте используется **`bot_listener.py`** (aiogram), а НЕ `userbot_daemon.py` (Telethon).

## Быстрый старт

### 1. Установка зависимостей

```bash
cd ~/MagicMirror
pip3 install --user aiogram python-dotenv
```

### 2. Создание файла .env

```bash
cd ~/MagicMirror/mirror_inbox
nano .env
```

Добавьте в файл:
```
BOT_TOKEN=8026936940:AAHfLuDi8n7-CRlHbhYmi6vh0Thc9AvDpKY
OUTPUT_JSON=/home/anton/MagicMirror/inbox.json
MAX_ITEMS=3
```

Сохраните (Ctrl+O, Enter, Ctrl+X)

### 3. Первый запуск (тест)

```bash
cd ~/MagicMirror/mirror_inbox
python3 bot_listener.py
```

Если всё работает, остановите бота (Ctrl+C).

### 4. Настройка автозапуска через systemd

```bash
cd ~/MagicMirror
sudo cp mirror_inbox.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mirror_inbox.service
```

### 5. Проверка работы

```bash
# Проверить статус
sudo systemctl status mirror_inbox.service

# Посмотреть логи
journalctl -u mirror_inbox.service -f

# Проверить JSON файл
cat ~/MagicMirror/inbox.json
```

## Управление сервисом

```bash
# Запустить
sudo systemctl start mirror_inbox.service

# Остановить
sudo systemctl stop mirror_inbox.service

# Перезапустить
sudo systemctl restart mirror_inbox.service

# Статус
sudo systemctl status mirror_inbox.service
```

## Готово! 🎉

Бот будет автоматически запускаться при загрузке системы и сохранять входящие сообщения в `~/MagicMirror/inbox.json`.

