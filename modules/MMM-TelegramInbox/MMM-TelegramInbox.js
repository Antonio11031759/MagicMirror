/* global Module, Log */

Module.register("MMM-TelegramInbox", {
    // Настройки по умолчанию
    defaults: {
        jsonPath: "/home/anton/MagicMirror/modules/MMM-TelegramInbox/inbox.json",
        pollInterval: 10000,   // 10 секунд
        maxItems: 3,
        maxChars: 100,
        header: "📱 Telegram"
    },

    // Инициализация модуля
    start: function() {
        Log.info("Starting module: " + this.name);
        
        // Отправляем конфигурацию в node_helper
        this.sendSocketNotification("TELEGRAM_CONFIG", this.config);
        
        // Инициализируем данные
        this.messages = [];
    },

    // Обработка уведомлений от node_helper
    socketNotificationReceived: function(notification, payload) {
        if (notification === "TELEGRAM_DATA") {
            this.messages = payload || [];
            this.updateDom();
        }
    },

    // Создание DOM элемента
    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "telegram-container";

        // Заголовок
        if (this.config.header) {
            const header = document.createElement("div");
            header.className = "telegram-header";
            header.innerHTML = this.config.header;
            wrapper.appendChild(header);
        }

        // Контейнер для сообщений
        const messagesContainer = document.createElement("div");
        messagesContainer.className = "telegram-messages";

        if (this.messages.length === 0) {
            // Нет сообщений
            const noMessages = document.createElement("div");
            noMessages.className = "telegram-no-messages";
            noMessages.innerHTML = "Нет новых сообщений";
            messagesContainer.appendChild(noMessages);
        } else {
            // Отображаем сообщения
            const messagesToShow = this.messages.slice(0, this.config.maxItems);
            
            messagesToShow.forEach((message) => {
                const messageElement = document.createElement("div");
                messageElement.className = "telegram-message";
                
                // Формируем строку сообщения в формате "Имя — текст"
                let messageText = `<strong class="telegram-sender">${message.from}</strong> — `;
                
                // Обрабатываем текст сообщения
                let text = message.text || "";
                text = text.replace(/\s+/g, " ").trim(); // Убираем лишние пробелы
                
                if (text.length > this.config.maxChars) {
                    text = text.substring(0, this.config.maxChars) + "…";
                }
                
                messageText += `<span class="telegram-text">${text}</span>`;
                
                messageElement.innerHTML = messageText;
                messagesContainer.appendChild(messageElement);
            });
        }

        wrapper.appendChild(messagesContainer);
        return wrapper;
    },

    // Стили модуля
    getStyles: function() {
        return ["MMM-TelegramInbox.css"];
    }
});
