# Telegram Inbox для MagicMirror

Система для отображения последних входящих сообщений Telegram на MagicMirror с использованием USERBOT (Telethon).

## Архитектура

Система состоит из двух компонентов:

1. **Telegram USERBOT** (Python + Telethon) - отдельный сервис под systemd
2. **MagicMirror модуль** (MMM-LocalInbox) - отображает сообщения на зеркале

## Установка

### 1. Подготовка системы

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Python и pip
sudo apt install -y python3 python3-pip

# Устанавливаем необходимые библиотеки
pip3 install --user telethon python-dotenv pytz
```

### 2. Настройка Telegram API

1. Перейдите на https://my.telegram.org
2. Войдите в свой аккаунт Telegram
3. Перейдите в "API development tools"
4. Создайте новое приложение и получите:
   - `API_ID`
   - `API_HASH`

### 3. Установка USERBOT

```bash
# Создаём директорию для userbot
mkdir -p /home/anton/mirror_inbox
cd /home/anton/mirror_inbox

# Копируем файлы
cp /path/to/userbot_daemon.py .
cp /path/to/env.sample .env.sample

# Настраиваем конфигурацию
cp .env.sample .env
nano .env
```

Заполните файл `.env`:

```env
API_ID=your_api_id_here
API_HASH=your_api_hash_here
SESSION_NAME=mirror_inbox
ALLOW_USERS=
OUTPUT_JSON=/home/anton/mirror_inbox/inbox.json
MAX_ITEMS=3
TIMEZONE=Europe/Berlin
```

### 4. Первый запуск USERBOT

```bash
# Первый запуск (интерактивный логин)
python3 userbot_daemon.py
```

При первом запуске потребуется:
1. Ввести номер телефона
2. Ввести код подтверждения из Telegram
3. При необходимости ввести пароль двухфакторной аутентификации

После успешного логина будет создан файл сессии `mirror_inbox.session`.

### 5. Настройка systemd сервиса

```bash
# Копируем unit файл
sudo cp /path/to/mirror_inbox.service /etc/systemd/system/

# Перезагружаем systemd
sudo systemctl daemon-reload

# Включаем автозапуск
sudo systemctl enable mirror_inbox.service

# Запускаем сервис
sudo systemctl start mirror_inbox.service

# Проверяем статус
sudo systemctl status mirror_inbox.service

# Просмотр логов
journalctl -u mirror_inbox.service -n 50 --no-pager -f
```

### 6. Установка модуля MagicMirror

```bash
# Переходим в директорию MagicMirror
cd ~/MagicMirror/modules

# Копируем модуль
cp -r /path/to/MMM-LocalInbox .

# Перезапускаем MagicMirror
pm2 restart MagicMirror
```

### 7. Настройка config.js

Добавьте модуль в файл `~/MagicMirror/config/config.js`:

```javascript
{
    module: "MMM-LocalInbox",
    position: "bottom_right",
    config: {
        jsonPath: "/home/anton/mirror_inbox/inbox.json",
        pollInterval: 5000,
        maxItems: 3,
        maxChars: 80,
        showTime: true,
        header: "📱 Telegram"
    }
}
```

## Конфигурация

### USERBOT (.env)

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| `API_ID` | ID приложения Telegram | - |
| `API_HASH` | Hash приложения Telegram | - |
| `SESSION_NAME` | Имя файла сессии | `mirror_inbox` |
| `ALLOW_USERS` | Разрешённые пользователи (через запятую) | Пусто (все) |
| `OUTPUT_JSON` | Путь к JSON файлу | `/home/anton/mirror_inbox/inbox.json` |
| `MAX_ITEMS` | Количество сообщений | `3` |
| `TIMEZONE` | Часовой пояс | `Europe/Berlin` |

### MagicMirror модуль

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| `jsonPath` | Путь к JSON файлу | `/home/anton/mirror_inbox/inbox.json` |
| `pollInterval` | Интервал опроса (мс) | `5000` |
| `maxItems` | Максимум сообщений | `3` |
| `maxChars` | Максимум символов в сообщении | `80` |
| `showTime` | Показывать время | `true` |
| `header` | Заголовок модуля | `""` |

## Управление сервисом

```bash
# Статус сервиса
sudo systemctl status mirror_inbox.service

# Запуск
sudo systemctl start mirror_inbox.service

# Остановка
sudo systemctl stop mirror_inbox.service

# Перезапуск
sudo systemctl restart mirror_inbox.service

# Отключение автозапуска
sudo systemctl disable mirror_inbox.service

# Просмотр логов
journalctl -u mirror_inbox.service -f

# Последние 100 строк логов
journalctl -u mirror_inbox.service -n 100 --no-pager
```

## Формат данных

USERBOT создаёт JSON файл со следующей структурой:

```json
[
  {
    "time": "14:30",
    "from": "Иван Петров",
    "text": "Привет! Как дела?"
  },
  {
    "time": "14:25",
    "from": "@username",
    "text": "Длинное сообщение которое будет обрезано если превышает maxChars..."
  }
]
```

## Безопасность

- Файлы `.env`, `*.session` и `inbox.json` исключены из git
- USERBOT использует вашу учётную запись Telegram (не Bot API)
- Можно ограничить список разрешённых отправителей через `ALLOW_USERS`

## Устранение неполадок

### USERBOT не запускается

1. Проверьте логи: `journalctl -u mirror_inbox.service -f`
2. Убедитесь, что файл `.env` заполнен корректно
3. Проверьте права доступа к директории: `ls -la /home/anton/mirror_inbox/`

### Модуль не отображает сообщения

1. Проверьте, что JSON файл создаётся: `cat /home/anton/mirror_inbox/inbox.json`
2. Проверьте права доступа к файлу: `ls -la /home/anton/mirror_inbox/inbox.json`
3. Проверьте логи MagicMirror: `pm2 logs MagicMirror`

### Проблемы с авторизацией

1. Удалите файл сессии: `rm /home/anton/mirror_inbox/*.session`
2. Перезапустите сервис: `sudo systemctl restart mirror_inbox.service`
3. Проверьте логи для интерактивного логина

## Обновление

```bash
# Остановка сервиса
sudo systemctl stop mirror_inbox.service

# Обновление файлов
cp /path/to/new/userbot_daemon.py /home/anton/mirror_inbox/
cp /path/to/new/mirror_inbox.service /etc/systemd/system/

# Перезагрузка systemd
sudo systemctl daemon-reload

# Запуск сервиса
sudo systemctl start mirror_inbox.service
```

## Лицензия

MIT License
