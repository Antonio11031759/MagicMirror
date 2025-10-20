#!/bin/bash

# Скрипт автоматической установки Telegram интеграции для MagicMirror
# Запуск: bash install_telegram.sh

set -e

echo "🚀 Установка Telegram интеграции для MagicMirror..."

# Проверяем, что мы в директории проекта
if [ ! -f "userbot_daemon.py" ]; then
    echo "❌ Ошибка: Запустите скрипт из корневой директории проекта Mirror"
    exit 1
fi

# 1. Установка зависимостей
echo "📦 Установка зависимостей..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip
pip3 install --user telethon python-dotenv --break-system-packages

# 2. Создание директории и копирование файлов
echo "📁 Создание директории и копирование файлов..."
mkdir -p ~/mirror_inbox
cd ~/mirror_inbox

# Копируем файлы из проекта
cp /home/anton/Mirror/userbot_daemon.py .
cp /home/anton/Mirror/env_config .env
cp /home/anton/Mirror/inbox.json .
chmod +x userbot_daemon.py

echo "✅ Файлы скопированы в ~/mirror_inbox/"

# 3. Первый запуск для авторизации
echo "🔐 Первый запуск для авторизации в Telegram..."
echo "При первом запуске потребуется:"
echo "1. Ввести номер телефона"
echo "2. Ввести код подтверждения из Telegram"
echo "3. При необходимости пароль 2FA"
echo ""
read -p "Нажмите Enter для продолжения..."

python3 userbot_daemon.py

# 4. Создание systemd сервиса
echo "⚙️ Создание systemd сервиса..."
sudo cp /home/anton/Mirror/mirror_inbox.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mirror_inbox.service

echo "✅ Сервис создан и запущен"

# 5. Создание модуля MagicMirror
echo "🎯 Создание модуля MagicMirror..."
mkdir -p /home/anton/MagicMirror/modules/MMM-TelegramInbox

# Копируем файлы модуля
cp /home/anton/Mirror/modules/MMM-TelegramInbox/MMM-TelegramInbox.js /home/anton/MagicMirror/modules/MMM-TelegramInbox/
cp /home/anton/Mirror/modules/MMM-TelegramInbox/MMM-TelegramInbox.css /home/anton/MagicMirror/modules/MMM-TelegramInbox/
cp /home/anton/Mirror/modules/MMM-TelegramInbox/node_helper.js /home/anton/MagicMirror/modules/MMM-TelegramInbox/

echo "✅ Модуль MagicMirror создан"

# 6. Добавление в config.js
echo "📝 Добавление модуля в config.js..."
CONFIG_FILE="/home/anton/MagicMirror/config/config.js"

# Проверяем, есть ли уже модуль в config.js
if grep -q "MMM-TelegramInbox" "$CONFIG_FILE"; then
    echo "⚠️ Модуль уже добавлен в config.js"
else
    # Создаем резервную копию
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
    
    # Добавляем модуль перед закрывающей скобкой modules
    sed -i '/],$/i\
	{\
		module: "MMM-TelegramInbox",\
		position: "bottom_right",\
		config: {\
			jsonPath: "/home/anton/mirror_inbox/inbox.json",\
			pollInterval: 5000,\
			maxItems: 3,\
			maxChars: 80,\
			showTime: true,\
			header: "Telegram"\
		}\
	},' "$CONFIG_FILE"
    
    echo "✅ Модуль добавлен в config.js"
fi

# 7. Перезапуск MagicMirror
echo "🔄 Перезапуск MagicMirror..."
pm2 restart MagicMirror

# 8. Проверка статуса
echo "🔍 Проверка статуса..."
echo ""
echo "Статус сервиса:"
sudo systemctl status mirror_inbox.service --no-pager

echo ""
echo "Проверка JSON файла:"
cat ~/mirror_inbox/inbox.json

echo ""
echo "🎉 Установка завершена!"
echo ""
echo "Для проверки работы:"
echo "1. Отправьте себе сообщение в Telegram"
echo "2. Проверьте JSON: cat ~/mirror_inbox/inbox.json"
echo "3. Сообщение должно появиться в правом нижнем углу зеркала"
echo ""
echo "Управление сервисом:"
echo "- Статус: sudo systemctl status mirror_inbox.service"
echo "- Логи: journalctl -u mirror_inbox.service -f"
echo "- Перезапуск: sudo systemctl restart mirror_inbox.service"
