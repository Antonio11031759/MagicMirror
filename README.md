# MagicMirror² с Telegram интеграцией

**MagicMirror²** - это открытая модульная платформа для создания умных зеркал с интеграцией Telegram сообщений.

## 📁 Структура проекта

```
Mirror/
├── install_telegram.sh          # Скрипт автоматической установки
├── telegram-bot.js              # Telegraf бот для Telegram (Bot API)
├── .env.sample                  # Пример .env для бота
├── inbox.json                   # Пустой JSON файл для сообщений
├── mirror_inbox.service         # systemd сервис
├── config_example.js            # Пример конфигурации модуля
├── modules/MMM-TelegramInbox/   # Модуль MagicMirror
│   ├── MMM-TelegramInbox.js     # Фронтенд модуля
│   ├── MMM-TelegramInbox.css    # Стили модуля
│   └── node_helper.js           # Бэкенд модуля
└── README.md                    # Документация
```

## ✅ Новая интеграция через официальный Telegram Bot API (Telegraf)

Рекомендуемая схема без USERBOT/Telethon. Бот получает `channel_post` из приватного канала и пишет последние 3 текстовых сообщения в `/home/anton/mirror_inbox/inbox.json`.

### Требования
- Токен бота из BotFather
- Node.js >= 22.18.0

### Установка и запуск
```bash
cd ~/MagicMirror
cp env.sample .env
# отредактируйте .env и задайте:
# BOT_TOKEN=123456:ABC...
# OUTPUT_JSON=/home/anton/mirror_inbox/inbox.json
# MAX_ITEMS=3
# TIMEZONE=Europe/Berlin

npm install
npm run telegram:bot
```

Добавьте бота администратором в приватный канал "Mirror Inbox" (у бота должен быть доступ к чтению сообщений канала). Публикуйте тексты — файл будет обновляться.

## 🔐 Вариант: Userbot (Telethon) c входом по QR (личные сообщения)

Если нужно читать личные сообщения без участия отправителей, используйте userbot с входом по QR:

```bash
cd ~/MagicMirror
python3 -m pip install --user telethon python-dotenv 'qrcode[pil]' --break-system-packages || true

# Правка окружения для userbot
mkdir -p /home/anton/mirror_inbox
chmod 700 /home/anton/mirror_inbox
cat > /home/anton/mirror_inbox/.env << 'EOF'
API_ID=
API_HASH=
SESSION_NAME=mirror_inbox
OUTPUT_JSON=/home/anton/mirror_inbox/inbox.json
MAX_ITEMS=3
TZ=Europe/Berlin
ALLOW_USERS=
EOF
chmod 600 /home/anton/mirror_inbox/.env

# Первый запуск (покажет QR)
npm run inbox:userbot
```

Сканируйте QR в Telegram: Settings → Devices → Link Desktop Device. После входа скрипт сохранит последние 3 ЛС в `/home/anton/mirror_inbox/inbox.json` и будет обновлять файл.

## 🚀 Быстрая установка на Raspberry Pi

### Предварительные требования

- Raspberry Pi с установленным MagicMirror²
- Telegram Bot token (получить у BotFather)
- Node.js версии >=22.18.0

### ⚡ Автоматическая установка (рекомендуется)

```bash
# Клонируем проект
git clone https://github.com/yourusername/Mirror.git
cd Mirror

# Запускаем автоматическую установку
bash install_telegram.sh
```

Скрипт автоматически:
- Установит все зависимости
- Скопирует файлы в нужные места
- Настроит systemd сервис
- Создаст модуль MagicMirror
- Добавит модуль в config.js
- Перезапустит MagicMirror

### 📋 Ручная установка

Если автоматическая установка не работает, выполните команды ниже:

### 1. Установка зависимостей

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем зависимости проекта
cd ~/MagicMirror
npm install
```

### 2. Создание Telegram USERBOT

```bash
# Создаем директорию для userbot
mkdir -p ~/mirror_inbox
cd ~/mirror_inbox

# Создаем .env файл с вашими API данными
cat > .env << 'EOF'
API_ID=22134486
API_HASH=31370c2a0de171b2d1e15c0c72ab755
SESSION_NAME=mirror_inbox
OUTPUT_JSON=/home/anton/mirror_inbox/inbox.json
MAX_ITEMS=3
TIMEZONE=Europe/Berlin
EOF

### 3. Копирование готовых файлов

```bash
# Копируем готовые файлы из проекта
cp /home/anton/MagicMirror/userbot_daemon.py .
cp /home/anton/MagicMirror/env_config .env
cp /home/anton/MagicMirror/inbox.json .
chmod +x userbot_daemon.py
```

### 4. Первый запуск и авторизация

```bash
# Запускаем скрипт для первого логина
python3 userbot_daemon.py
```

**При первом запуске потребуется:**
1. Ввести номер телефона (например: +79123456789)
2. Ввести код подтверждения из Telegram
3. При необходимости пароль 2FA

После успешного логина нажмите `Ctrl+C` для остановки.

### 5. Создание systemd сервиса

```bash
# Копируем готовый systemd unit файл
sudo cp /home/anton/Mirror/mirror_inbox.service /etc/systemd/system/

# Перезагружаем systemd и запускаем сервис
sudo systemctl daemon-reload
sudo systemctl enable --now mirror_inbox.service
```

### 6. Создание модуля MagicMirror

```bash
# Создаем директорию модуля
mkdir -p /home/anton/MagicMirror/modules/MMM-TelegramInbox

# Копируем готовые файлы модуля
cp /home/anton/Mirror/modules/MMM-TelegramInbox/MMM-TelegramInbox.js /home/anton/MagicMirror/modules/MMM-TelegramInbox/
cp /home/anton/Mirror/modules/MMM-TelegramInbox/MMM-TelegramInbox.css /home/anton/Mirror/modules/MMM-TelegramInbox/
cp /home/anton/Mirror/modules/MMM-TelegramInbox/node_helper.js /home/anton/Mirror/modules/MMM-TelegramInbox/
```

### 7. Запуск системы

```bash
# Перезапускаем MagicMirror
pm2 restart MagicMirror

# Проверяем статус сервиса
sudo systemctl status mirror_inbox.service

# Проверяем логи
journalctl -u mirror_inbox.service -f
```

## 🔧 Управление сервисом

```bash
# Проверка статуса
sudo systemctl status mirror_inbox.service

# Запуск
sudo systemctl start mirror_inbox.service

# Остановка
sudo systemctl stop mirror_inbox.service

# Перезапуск
sudo systemctl restart mirror_inbox.service

# Просмотр логов
journalctl -u mirror_inbox.service -f

# Последние 50 строк логов
journalctl -u mirror_inbox.service -n 50 --no-pager
```

## 🐛 Устранение неполадок

### USERBOT не запускается
```bash
# Проверка логов
journalctl -u mirror_inbox.service -n 50 --no-pager

# Проверка прав доступа
ls -la ~/mirror_inbox/

# Переустановка зависимостей
pip3 install --user telethon python-dotenv
```

### Проблемы с авторизацией
```bash
# Удаление файла сессии
rm ~/mirror_inbox/*.session

# Перезапуск сервиса
sudo systemctl restart mirror_inbox.service
```

### Модуль не отображает сообщения
```bash
# Проверка JSON файла
cat ~/mirror_inbox/inbox.json

# Проверка логов MagicMirror
pm2 logs MagicMirror

# Проверка прав на файлы модуля
ls -la /home/anton/MagicMirror/modules/MMM-TelegramInbox/
```

## 📱 Проверка работы

1. Отправьте себе сообщение в Telegram
2. Проверьте JSON файл: `cat ~/mirror_inbox/inbox.json`
3. Сообщение должно появиться в правом нижнем углу зеркала через 5 секунд

## 🎯 Результат

После установки у вас будет:
- ✅ Telegram USERBOT слушает входящие сообщения
- ✅ Последние 3 сообщения сохраняются в JSON
- ✅ MagicMirror отображает их в правом нижнем углу
- ✅ Формат: **Время — Имя — текст сообщения**
- ✅ Обновление каждые 5 секунд
- ✅ Автозапуск при перезагрузке Raspberry Pi

## 📄 Лицензия

MIT License

---

**MagicMirror²** - оригинальный проект: [https://magicmirror.builders](https://magicmirror.builders)