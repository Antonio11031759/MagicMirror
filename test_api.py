#!/usr/bin/env python3
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

API_ID = os.getenv("API_ID")
API_HASH = os.getenv("API_HASH")

print("=== Проверка API ключей ===")
print(f"API_ID: {API_ID}")
print(f"API_HASH: {API_HASH}")
print(f"API_ID тип: {type(API_ID)}")
print(f"API_HASH тип: {type(API_HASH)}")

if not API_ID or not API_HASH:
    print("❌ ОШИБКА: API_ID или API_HASH не найдены!")
    exit(1)

# Проверяем, что API_ID - это число
try:
    api_id_int = int(API_ID)
    print(f"✅ API_ID корректное число: {api_id_int}")
except ValueError:
    print("❌ ОШИБКА: API_ID не является числом!")

# Проверяем длину API_HASH
if len(API_HASH) == 32:
    print("✅ API_HASH имеет правильную длину (32 символа)")
else:
    print(f"❌ ОШИБКА: API_HASH имеет неправильную длину ({len(API_HASH)} символов)")

print("\n=== Тест подключения к Telegram ===")
try:
    from telethon import TelegramClient
    
    client = TelegramClient('test_session', API_ID, API_HASH)
    
    # Пробуем подключиться
    client.connect()
    print("✅ Подключение к Telegram API успешно!")
    
    # Проверяем авторизацию
    if client.is_user_authorized():
        print("✅ Пользователь уже авторизован!")
    else:
        print("⚠️ Пользователь не авторизован, нужна авторизация")
    
    client.disconnect()
    
except Exception as e:
    print(f"❌ ОШИБКА подключения: {e}")
    print("\nВозможные причины:")
    print("1. Неверные API_ID/API_HASH")
    print("2. Проблемы с интернетом")
    print("3. Блокировка Telegram в вашей стране")
    print("4. Нужно создать новое приложение на https://my.telegram.org")
