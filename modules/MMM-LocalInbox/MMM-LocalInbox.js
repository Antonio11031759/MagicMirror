/* global Module, Log, moment */

Module.register("MMM-LocalInbox", {
    defaults: {
        jsonPath: "/home/anton/mirror_inbox/inbox.json",
        pollInterval: 5000,
        maxItems: 3,
        maxChars: 80,
        showTime: true,
        header: "Сообщения",
        timezone: "Europe/Berlin"
    },

    start: function() {
        this.items = [];
        this.sendSocketNotification("LOCALINBOX_CONFIG", {
            jsonPath: this.config.jsonPath,
            pollInterval: this.config.pollInterval || 3000,
            timezone: this.config.timezone || "Europe/Berlin"
        });
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "LOCALINBOX_UPDATE") {
            this.items = payload;
            this.updateDom();
        }
    },

    getHeader: function() {
        // Support both top-level module header and config.header
        return (this.data && this.data.header) || this.config.header || "";
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "localinbox";

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

    getScripts: function() {
        return ["moment.js", "moment-timezone.js"];
    },

    getStyles: function() {
        return ["MMM-LocalInbox.css"];
    }
});
