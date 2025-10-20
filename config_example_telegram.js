// Пример конфигурации для MagicMirror config.js
// Добавьте этот блок в массив modules

{
    module: "MMM-TelegramInbox",
    position: "bottom_right",
    config: {
        jsonPath: "/home/anton/MagicMirror/modules/MMM-TelegramInbox/inbox.json",
        pollInterval: 10000,    // 10 секунд
        maxItems: 3,           // Максимальное количество сообщений
        maxChars: 100,         // Максимальная длина текста сообщения
        header: "📱 Telegram"  // Заголовок модуля
    }
}
