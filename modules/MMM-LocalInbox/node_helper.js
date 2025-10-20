const NodeHelper = require("node_helper");
const fs = require("fs");
const moment = require("moment-timezone");

module.exports = NodeHelper.create({
  start() {
    this.timer = null;
    this.jsonPath = null;
    this.pollInterval = 5000;
    this.timezone = "Europe/Berlin";
    console.log("MMM-LocalInbox helper started");
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "LOCALINBOX_CONFIG") {
      this.jsonPath = payload.jsonPath;
      this.pollInterval = Number(payload.pollInterval || 5000);
      this.timezone = payload.timezone || "Europe/Berlin";
      if (this.timer) clearInterval(this.timer);
      this.readAndBroadcast();
      this.timer = setInterval(() => this.readAndBroadcast(), this.pollInterval);
    }
  },

  readAndBroadcast() {
    if (!this.jsonPath) return;
    try {
      const raw = fs.readFileSync(this.jsonPath, "utf-8");
      const data = JSON.parse(raw);
      
      // Process each message to ensure time is in Berlin timezone
      const processedData = Array.isArray(data) ? data.map(msg => {
        if (msg.time) {
          // If time is already formatted, keep it; otherwise format it
          return msg;
        } else {
          // If no time field, add current Berlin time
          return {
            ...msg,
            time: moment().tz(this.timezone).format("HH:mm")
          };
        }
      }) : [];
      
      this.sendSocketNotification("LOCALINBOX_UPDATE", processedData);
    } catch (e) {
      this.sendSocketNotification("LOCALINBOX_UPDATE", []);
    }
  },

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
});
