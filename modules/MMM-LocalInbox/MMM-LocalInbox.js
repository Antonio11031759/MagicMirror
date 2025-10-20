/* global Module, Log, moment */

Module.register("MMM-LocalInbox", {
    // Настройки по умолчанию
    defaults: {
        jsonPath: "/home/anton/mirror_inbox/inbox.json",
        pollInterval: 5000,   // мс
        maxItems: 3,
        maxChars: 80,
        showTime: true,
        header: ""            // необязательный заголовок
    },

    // Инициализация модуля
    start: function() {
        Log.info("Starting module: " + this.name);
        
        // Отправляем конфигурацию в node_helper
        this.sendSocketNotification("INBOX_CONFIG", this.config);
        
        // Инициализируем данные
        this.messages = [];
    },

    // Обработка уведомлений от node_helper
    socketNotificationReceived: function(notification, payload) {
        if (notification === "INBOX_DATA") {
            this.messages = payload || [];
            this.updateDom();
        }
    },

    // Создание DOM элемента
    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "inbox-container";

        // Заголовок (если задан)
        if (this.config.header) {
            const header = document.createElement("div");
            header.className = "inbox-header";
            header.innerHTML = this.config.header;
            wrapper.appendChild(header);
        }

        // Контейнер для сообщений
        const messagesContainer = document.createElement("div");
        messagesContainer.className = "inbox-messages";

        if (this.messages.length === 0) {
            // Нет сообщений
            const noMessages = document.createElement("div");
            noMessages.className = "inbox-no-messages";
            noMessages.innerHTML = "Нет новых сообщений";
            messagesContainer.appendChild(noMessages);
        } else {
            // Отображаем сообщения
            const messagesToShow = this.messages.slice(0, this.config.maxItems);
            
            messagesToShow.forEach((message) => {
                const messageElement = document.createElement("div");
                messageElement.className = "inbox-message";
                
                // Формируем строку сообщения
                let messageText = "";
                
                if (this.config.showTime) {
                    messageText += `<span class="inbox-time">${message.time}</span> — `;
                }
                
                messageText += `<strong class="inbox-sender">${message.from}</strong>: `;
                
                // Обрабатываем текст сообщения
                let text = message.text || "";
                text = text.replace(/\s+/g, " ").trim(); // Убираем лишние пробелы
                
                if (text.length > this.config.maxChars) {
                    text = text.substring(0, this.config.maxChars) + "…";
                }
                
                messageText += `<span class="inbox-text">${text}</span>`;
                
                messageElement.innerHTML = messageText;
                messagesContainer.appendChild(messageElement);
            });
        }

        wrapper.appendChild(messagesContainer);
        return wrapper;
    },

    // Стили модуля
    getStyles: function() {
        return ["MMM-LocalInbox.css"];
    }
});
