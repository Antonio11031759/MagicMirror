# ЧЕК-ЛИСТ УСТАНОВКИ TELEGRAM INBOX ДЛЯ MAGICMIRROR

## 1. ПОДГОТОВКА СИСТЕМЫ

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Python и pip
sudo apt install -y python3 python3-pip

# Установка библиотек Python
pip3 install --user telethon python-dotenv pytz
```

## 2. НАСТРОЙКА TELEGRAM API

1. Перейти на https://my.telegram.org
2. Войти в аккаунт Telegram
3. Создать приложение в "API development tools"
4. Получить API_ID и API_HASH

## 3. УСТАНОВКА USERBOT

```bash
# Создание директории
mkdir -p /home/anton/mirror_inbox
cd /home/anton/mirror_inbox

# Копирование файлов (замените /path/to/ на реальные пути)
cp /path/to/userbot_daemon.py .
cp /path/to/env.sample .env.sample

# Настройка конфигурации
cp .env.sample .env
nano .env
```

## 4. ПЕРВЫЙ ЗАПУСК USERBOT

```bash
# Интерактивный логин
python3 userbot_daemon.py
```

**Ввести:**
- Номер телефона
- Код подтверждения из Telegram
- Пароль 2FA (если включён)

## 5. НАСТРОЙКА SYSTEMD СЕРВИСА

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

## 6. УСТАНОВКА МОДУЛЯ MAGICMIRROR

```bash
# Переход в директорию модулей
cd ~/MagicMirror/modules

# Копирование модуля
cp -r /path/to/MMM-LocalInbox .

# Перезапуск MagicMirror
pm2 restart MagicMirror
```

## 7. НАСТРОЙКА CONFIG.JS

Добавить в `~/MagicMirror/config/config.js`:

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

## 8. ПРОВЕРКА РАБОТЫ

```bash
# Проверка статуса сервиса
sudo systemctl status mirror_inbox.service

# Просмотр логов
journalctl -u mirror_inbox.service -f

# Проверка JSON файла
cat /home/anton/mirror_inbox/inbox.json

# Проверка логов MagicMirror
pm2 logs MagicMirror
```

## 9. УПРАВЛЕНИЕ СЕРВИСОМ

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

## 10. УСТРАНЕНИЕ НЕПОЛАДОК

```bash
# Если сервис не запускается
journalctl -u mirror_inbox.service -n 50 --no-pager

# Если проблемы с авторизацией
rm /home/anton/mirror_inbox/*.session
sudo systemctl restart mirror_inbox.service

# Проверка прав доступа
ls -la /home/anton/mirror_inbox/
```

## ГОТОВО! 🎉

После выполнения всех шагов:
1. USERBOT будет слушать входящие сообщения Telegram
2. Последние 3 сообщения будут сохраняться в JSON файл
3. MagicMirror будет отображать их в позиции bottom_right
4. Обновление происходит каждые 5 секунд
