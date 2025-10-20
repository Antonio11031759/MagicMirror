# УСТАНОВКА TELEGRAM ИНТЕГРАЦИИ ДЛЯ MAGICMIRROR

## Обзор системы

Система состоит из двух компонентов:
1. **Python USERBOT** (`userbot_daemon.py`) - слушает Telegram и сохраняет сообщения в JSON
2. **MagicMirror модуль** (`MMM-TelegramInbox`) - отображает сообщения на экране

## Шаг 1: Подготовка системы

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Python и pip
sudo apt install -y python3 python3-pip

# Установка необходимых библиотек
pip3 install --user telethon python-dotenv
```

## Шаг 2: Установка USERBOT

```bash
# Создание директории для модуля
mkdir -p /home/anton/MagicMirror/modules/MMM-TelegramInbox
cd /home/anton/MagicMirror/modules/MMM-TelegramInbox

# Копирование файлов
cp /path/to/userbot_daemon.py .
cp /path/to/env_config .env

# Проверка содержимого .env файла
cat .env
```

Файл `.env` должен содержать:
```
API_ID=22134486
API_HASH=31370c2a0de171b2d1e15c0c72ab755
SESSION_NAME=mirror_inbox
OUTPUT_JSON=/home/anton/MagicMirror/modules/MMM-TelegramInbox/inbox.json
MAX_ITEMS=3
```

## Шаг 3: Первый запуск USERBOT

```bash
# Первый запуск (интерактивный логин)
python3 userbot_daemon.py
```

При первом запуске потребуется:
1. Ввести номер телефона
2. Ввести код подтверждения из Telegram
3. При необходимости ввести пароль двухфакторной аутентификации

После успешного логина будет создан файл сессии `mirror_inbox.session`.

## Шаг 4: Настройка systemd сервиса

```bash
# Копирование unit файла
sudo cp /path/to/mirror_inbox.service /etc/systemd/system/

# Перезагрузка systemd
sudo systemctl daemon-reload

# Включение автозапуска
sudo systemctl enable mirror_inbox.service

# Запуск сервиса
sudo systemctl start mirror_inbox.service

# Проверка статуса
sudo systemctl status mirror_inbox.service
```

## Шаг 5: Установка модуля MagicMirror

```bash
# Переход в директорию модулей (если ещё не там)
cd /home/anton/MagicMirror/modules

# Копирование модуля (если файлы ещё не скопированы)
cp -r /path/to/MMM-TelegramInbox .

# Перезапуск MagicMirror
pm2 restart MagicMirror
```

## Шаг 6: Настройка config.js

Добавьте модуль в файл `~/MagicMirror/config/config.js`:

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

## Шаг 7: Проверка работы

```bash
# Проверка статуса сервиса
sudo systemctl status mirror_inbox.service

# Просмотр логов USERBOT
journalctl -u mirror_inbox.service -f

# Проверка JSON файла
cat /home/anton/MagicMirror/modules/MMM-TelegramInbox/inbox.json

# Проверка логов MagicMirror
pm2 logs MagicMirror
```

## Управление сервисом

```bash
# Остановка
sudo systemctl stop mirror_inbox.service

# Запуск
sudo systemctl start mirror_inbox.service

# Перезапуск
sudo systemctl restart mirror_inbox.service

# Отключение автозапуска
sudo systemctl disable mirror_inbox.service
```

## Формат данных

USERBOT создаёт JSON файл со следующей структурой:

```json
[
  {
    "from": "Сергей",
    "text": "Ты сегодня будешь играть?"
  },
  {
    "from": "Мама",
    "text": "Не забудь купить хлеб"
  },
  {
    "from": "Telegram",
    "text": "Код входа: 12345"
  }
]
```

## Устранение неполадок

### USERBOT не запускается
```bash
# Проверка логов
journalctl -u mirror_inbox.service -n 50 --no-pager

# Проверка прав доступа
ls -la /home/anton/MagicMirror/modules/MMM-TelegramInbox/
```

### Проблемы с авторизацией
```bash
# Удаление файла сессии
rm /home/anton/MagicMirror/modules/MMM-TelegramInbox/*.session

# Перезапуск сервиса
sudo systemctl restart mirror_inbox.service
```

### Модуль не отображает сообщения
```bash
# Проверка JSON файла
cat /home/anton/MagicMirror/modules/MMM-TelegramInbox/inbox.json

# Проверка логов MagicMirror
pm2 logs MagicMirror
```

## Готово! 🎉

После выполнения всех шагов:
1. USERBOT будет слушать входящие сообщения Telegram
2. Последние 3 сообщения будут сохраняться в JSON файл
3. MagicMirror будет отображать их в правом нижнем углу
4. Обновление происходит каждые 10 секунд
5. Формат отображения: **Имя** — текст сообщения
