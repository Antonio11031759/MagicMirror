// Пример конфигурации для MagicMirror config.js
// Добавьте этот блок в массив modules

{
    module: "MMM-LocalInbox",
    position: "bottom_right",
    config: {
        jsonPath: "/home/anton/mirror_inbox/inbox.json",
        pollInterval: 5000,    // Интервал опроса в миллисекундах
        maxItems: 3,          // Максимальное количество сообщений
        maxChars: 80,         // Максимальная длина текста сообщения
        showTime: true,       // Показывать время сообщения
        header: "📱 Telegram" // Заголовок модуля (необязательно)
    }
}
