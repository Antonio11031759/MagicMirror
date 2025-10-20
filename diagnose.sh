#!/bin/bash

echo "🔍 Диагностика Telegram API на Raspberry Pi"
echo "=============================================="

# Проверяем файлы
echo "📁 Проверка файлов:"
ls -la ~/mirror_inbox/

echo ""
echo "📄 Содержимое .env файла:"
cat ~/mirror_inbox/.env

echo ""
echo "🐍 Проверка Python и библиотек:"
python3 --version
pip3 list | grep -E "(telethon|dotenv)"

echo ""
echo "🌐 Проверка подключения к интернету:"
ping -c 3 api.telegram.org

echo ""
echo "🔑 Тест API ключей:"
cd ~/mirror_inbox
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
api_id = os.getenv('API_ID')
api_hash = os.getenv('API_HASH')
print(f'API_ID: {api_id} (тип: {type(api_id)})')
print(f'API_HASH: {api_hash} (тип: {type(api_hash)})')
if api_id and api_hash:
    try:
        api_id_int = int(api_id)
        print(f'✅ API_ID корректное число: {api_id_int}')
    except ValueError:
        print('❌ API_ID не является числом!')
    if len(api_hash) == 32:
        print('✅ API_HASH имеет правильную длину')
    else:
        print(f'❌ API_HASH неправильной длины: {len(api_hash)}')
else:
    print('❌ API_ID или API_HASH не найдены!')
"

echo ""
echo "🚀 Попробуйте создать новое приложение на https://my.telegram.org/apps"
echo "   и получить новые API ключи!"
