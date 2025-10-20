/* global Module, Log */

Module.register("MMM-LocalInbox", {
    defaults: {
        jsonPath: "/home/anton/mirror_inbox/inbox.json",
        pollInterval: 5000,
        maxItems: 3,
        maxChars: 80,
        showTime: true,
        header: "Сообщения"
    },

    start: function() {
        this.items = [];
        this.error = null;
        this.readNow();
        this.scheduleUpdate();
    },

    scheduleUpdate: function() {
        const interval = this.config.pollInterval || 5000;
        setInterval(() => this.readNow(), interval);
    },

    readNow: function() {
        this.sendSocketNotification("INBOX_READ", { jsonPath: this.config.jsonPath, maxItems: this.config.maxItems });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification !== "INBOX_DATA") return;
        this.items = (payload && payload.items) || [];
        this.error = payload ? payload.error : null;
        this.updateDom({ animationSpeed: 300 });
    },

    getHeader: function() {
        // Support both top-level module header and config.header
        return (this.data && this.data.header) || this.config.header || "";
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "localinbox";

        if (this.error) {
            const err = document.createElement("div");
            err.style.opacity = 0.7;
            err.style.fontSize = "85%";
            err.textContent = this.error;
            wrapper.appendChild(err);
            return wrapper;
        }

        if (!this.items || this.items.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "Нет новых сообщений";
            wrapper.appendChild(empty);
            return wrapper;
        }

        const ul = document.createElement("ul");
        this.items.slice(0, this.config.maxItems).forEach((m) => {
            const li = document.createElement("li");

            if (this.config.showTime && m.time) {
                const t = document.createElement("span");
                t.className = "ili-time";
                t.textContent = `[${m.time}]`;
                li.appendChild(t);
            }

            const from = document.createElement("span");
            from.className = "ili-from";
            from.textContent = `${m.from}:`;
            li.appendChild(from);

            const text = document.createElement("span");
            text.className = "ili-text";
            text.textContent = this.truncate((m.text || "").replace(/\s+/g, " ").trim(), this.config.maxChars);
            li.appendChild(text);

            ul.appendChild(li);
        });
        wrapper.appendChild(ul);
        return wrapper;
    },

    truncate: function(str, n) {
        if (!str) return "";
        return str.length > n ? str.slice(0, n) + "…" : str;
    },

    getStyles: function() {
        return ["MMM-LocalInbox.css"];
    }
});
