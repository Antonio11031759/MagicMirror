/* global NodeHelper, Log */

NodeHelper.register("MMM-LocalInbox", {
    // Инициализация
    start: function() {
        Log.info("Starting node helper for: " + this.name);
        
        this.config = null;
        this.pollTimer = null;
    },

    // Обработка конфигурации от фронтенда
    socketNotificationReceived: function(notification, payload) {
        if (notification === "INBOX_CONFIG") {
            this.config = payload;
            Log.info("Received config:", this.config);
            
            // Запускаем опрос JSON файла
            this.startPolling();
        }
    },

    // Запуск периодического опроса JSON файла
    startPolling: function() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }
        
        if (!this.config || !this.config.jsonPath) {
            Log.error("No config or jsonPath provided");
            return;
        }
        
        // Первое чтение сразу
        this.readInboxData();
        
        // Затем по таймеру
        this.pollTimer = setInterval(() => {
            this.readInboxData();
        }, this.config.pollInterval || 5000);
        
        Log.info(`Started polling inbox data every ${this.config.pollInterval}ms`);
    },

    // Чтение данных из JSON файла
    readInboxData: function() {
        const fs = require("fs");
        const path = require("path");
        
        try {
            // Проверяем существование файла
            if (!fs.existsSync(this.config.jsonPath)) {
                Log.warn(`Inbox file not found: ${this.config.jsonPath}`);
                this.sendSocketNotification("INBOX_DATA", []);
                return;
            }
            
            // Читаем файл
            const data = fs.readFileSync(this.config.jsonPath, "utf8");
            
            // Парсим JSON
            const messages = JSON.parse(data);
            
            // Проверяем, что это массив
            if (!Array.isArray(messages)) {
                Log.error("Invalid JSON format: expected array");
                this.sendSocketNotification("INBOX_DATA", []);
                return;
            }
            
            // Отправляем данные на фронтенд
            this.sendSocketNotification("INBOX_DATA", messages);
            
        } catch (error) {
            Log.error(`Error reading inbox data: ${error.message}`);
            // При ошибке отправляем пустой массив
            this.sendSocketNotification("INBOX_DATA", []);
        }
    },

    // Очистка при остановке
    stop: function() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        Log.info("Stopped node helper for: " + this.name);
    }
});
