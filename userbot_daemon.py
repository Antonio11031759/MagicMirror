#!/usr/bin/env python3
"""
Telegram USERBOT для MagicMirror
Слушает входящие сообщения и записывает последние N сообщений в JSON файл
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from telethon import TelegramClient, events
from telethon.tl.types import User, Chat, Channel
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

class TelegramInboxBot:
    def __init__(self):
        # Настройки из .env
        self.api_id = os.getenv('API_ID')
        self.api_hash = os.getenv('API_HASH')
        self.session_name = os.getenv('SESSION_NAME', 'mirror_inbox')
        self.output_json = os.getenv('OUTPUT_JSON', '/home/anton/MagicMirror/modules/MMM-TelegramInbox/inbox.json')
        self.max_items = int(os.getenv('MAX_ITEMS', '3'))
        
        # Проверяем обязательные параметры
        if not self.api_id or not self.api_hash:
            print("ОШИБКА: Необходимо указать API_ID и API_HASH в .env файле")
            sys.exit(1)
        
        # Создаём клиент Telegram
        self.client = TelegramClient(self.session_name, self.api_id, self.api_hash)
        
        # Список сообщений
        self.messages: List[Dict[str, Any]] = []
        
        # Создаём директорию для выходного файла если её нет
        Path(self.output_json).parent.mkdir(parents=True, exist_ok=True)
        
        print(f"Инициализация бота:")
        print(f"  - API ID: {self.api_id}")
        print(f"  - Session: {self.session_name}")
        print(f"  - Output JSON: {self.output_json}")
        print(f"  - Max items: {self.max_items}")
    
    def get_sender_name(self, sender) -> str:
        """Получает имя отправителя"""
        if isinstance(sender, User):
            if sender.first_name:
                name = sender.first_name
                if sender.last_name:
                    name += f" {sender.last_name}"
                return name
            elif sender.username:
                return f"@{sender.username}"
            else:
                return "Без имени"
        elif isinstance(sender, (Chat, Channel)):
            return sender.title or "Группа"
        else:
            return "Неизвестно"
    
    def add_message(self, message_text: str, sender):
        """Добавляет новое сообщение в список"""
        sender_name = self.get_sender_name(sender)
        
        new_message = {
            "from": sender_name,
            "text": message_text.strip()
        }
        
        # Добавляем в начало списка
        self.messages.insert(0, new_message)
        
        # Ограничиваем количество сообщений
        if len(self.messages) > self.max_items:
            self.messages = self.messages[:self.max_items]
        
        print(f"Добавлено сообщение: {sender_name}: {message_text[:50]}...")
    
    def save_messages_to_json(self):
        """Сохраняет сообщения в JSON файл"""
        try:
            with open(self.output_json, 'w', encoding='utf-8') as f:
                json.dump(self.messages, f, ensure_ascii=False, indent=2)
            print(f"Сохранено {len(self.messages)} сообщений в {self.output_json}")
        except Exception as e:
            print(f"Ошибка сохранения JSON: {e}")
    
    async def handle_new_message(self, event):
        """Обрабатывает новое входящее сообщение"""
        try:
            # Получаем сообщение
            message = event.message
            
            # Проверяем, что это текстовое сообщение
            if not message.text:
                return
            
            # Получаем отправителя
            sender = await message.get_sender()
            if not sender:
                return
            
            # Добавляем сообщение
            self.add_message(message.text, sender)
            
            # Сохраняем в JSON
            self.save_messages_to_json()
            
        except Exception as e:
            print(f"Ошибка обработки сообщения: {e}")
    
    async def start_bot(self):
        """Запускает бота"""
        print("Запуск Telegram userbot...")
        
        # Подключаемся к Telegram
        await self.client.start()
        
        # Проверяем авторизацию
        me = await self.client.get_me()
        print(f"Авторизован как: {me.first_name} (@{me.username})")
        
        # Регистрируем обработчик новых сообщений
        self.client.add_event_handler(
            self.handle_new_message,
            events.NewMessage(incoming=True)
        )
        
        print("Бот запущен и слушает входящие сообщения...")
        print("Нажмите Ctrl+C для остановки")
        
        # Инициализируем пустой JSON файл
        self.save_messages_to_json()
        
        # Ждём до бесконечности
        try:
            await self.client.run_until_disconnected()
        except KeyboardInterrupt:
            print("\nПолучен сигнал остановки...")
        finally:
            await self.client.disconnect()
            print("Бот остановлен")

def main():
    """Главная функция"""
    print("=== Telegram USERBOT для MagicMirror ===")
    
    # Проверяем наличие .env файла
    env_file = Path('.env')
    if not env_file.exists():
        print("ОШИБКА: Файл .env не найден!")
        print("Создайте файл .env с необходимыми параметрами")
        sys.exit(1)
    
    # Создаём и запускаем бота
    bot = TelegramInboxBot()
    
    try:
        asyncio.run(bot.start_bot())
    except Exception as e:
        print(f"Критическая ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()