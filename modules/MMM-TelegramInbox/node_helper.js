/* global NodeHelper, Log */

NodeHelper.register("MMM-TelegramInbox", {
    // Инициализация
    start: function() {
        Log.info("Starting node helper for: " + this.name);
        
        this.config = null;
        this.pollTimer = null;
    },

    // Обработка конфигурации от фронтенда
    socketNotificationReceived: function(notification, payload) {
        if (notification === "TELEGRAM_CONFIG") {
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
        this.readTelegramData();
        
        // Затем по таймеру каждые 10 секунд
        this.pollTimer = setInterval(() => {
            this.readTelegramData();
        }, this.config.pollInterval || 10000);
        
        Log.info(`Started polling telegram data every ${this.config.pollInterval}ms`);
    },

    // Чтение данных из JSON файла
    readTelegramData: function() {
        const fs = require("fs");
        const path = require("path");
        
        try {
            // Проверяем существование файла
            if (!fs.existsSync(this.config.jsonPath)) {
                Log.warn(`Telegram inbox file not found: ${this.config.jsonPath}`);
                this.sendSocketNotification("TELEGRAM_DATA", []);
                return;
            }
            
            // Читаем файл
            const data = fs.readFileSync(this.config.jsonPath, "utf8");
            
            // Парсим JSON
            const messages = JSON.parse(data);
            
            // Проверяем, что это массив
            if (!Array.isArray(messages)) {
                Log.error("Invalid JSON format: expected array");
                this.sendSocketNotification("TELEGRAM_DATA", []);
                return;
            }
            
            // Отправляем данные на фронтенд
            this.sendSocketNotification("TELEGRAM_DATA", messages);
            
        } catch (error) {
            Log.error(`Error reading telegram data: ${error.message}`);
            // При ошибке отправляем пустой массив
            this.sendSocketNotification("TELEGRAM_DATA", []);
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
