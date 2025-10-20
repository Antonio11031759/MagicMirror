/* global NodeHelper, Log */
const fs = require("fs");

NodeHelper.register("MMM-LocalInbox", {
    start: function() {
        Log.info("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: async function(notification, payload) {
        if (notification !== "INBOX_READ") return;

        const jsonPath = payload && payload.jsonPath;
        const maxItems = (payload && payload.maxItems) || 3;

        if (!jsonPath) {
            this.sendSocketNotification("INBOX_DATA", { items: [], error: "jsonPath not provided" });
            return;
        }

        try {
            if (!fs.existsSync(jsonPath)) {
                this.sendSocketNotification("INBOX_DATA", { items: [], error: null });
                return;
            }

            const raw = fs.readFileSync(jsonPath, "utf8");
            let data = [];
            try {
                const parsed = JSON.parse(raw);
                data = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                this.sendSocketNotification("INBOX_DATA", { items: [], error: "Invalid JSON" });
                return;
            }

            const items = data.slice(0, maxItems);
            this.sendSocketNotification("INBOX_DATA", { items, error: null });
        } catch (error) {
            this.sendSocketNotification("INBOX_DATA", { items: [], error: String(error && error.message || error) });
        }
    }
});
