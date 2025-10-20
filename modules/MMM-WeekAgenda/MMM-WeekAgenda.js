/* global Module, Log */

Module.register("MMM-WeekAgenda", {
  defaults: {
    // Max events per day to display
    maxPerDay: 6,
    // Show time before title
    showTime: true,
    // Use 24h time format
    timeFormat: "HH:mm",
    // Start week on Monday
    weekStartsOnMonday: true,
    // Optional header
    header: "Неделя"
  },

  start() {
    this.events = [];
    this.days = this._initEmptyWeek();
  },

  notificationReceived(notification, payload) {
    if (notification === "CALENDAR_EVENTS" && Array.isArray(payload)) {
      this.events = payload;
      this.days = this._groupByDay(payload);
      this.updateDom(300);
    }
  },

  getStyles() {
    return ["MMM-WeekAgenda.css"]; 
  },

  getHeader() {
    return this.config.header || "";
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "wa-container";

    const grid = document.createElement("div");
    grid.className = "wa-grid";

    // Header row: Mon..Sun (or Sun..Sat)
    const headerRow = document.createElement("div");
    headerRow.className = "wa-row wa-header";
    this._orderedDays().forEach((d) => {
      const cell = document.createElement("div");
      cell.className = "wa-col wa-col-header";
      cell.textContent = d.label;
      headerRow.appendChild(cell);
    });
    grid.appendChild(headerRow);

    // Events row (single row with 7 columns)
    const eventsRow = document.createElement("div");
    eventsRow.className = "wa-row wa-events";

    this._orderedDays().forEach((d) => {
      const cell = document.createElement("div");
      cell.className = "wa-col wa-col-events";

      const ul = document.createElement("ul");
      const items = this.days[d.key] || [];
      items.slice(0, this.config.maxPerDay).forEach((ev) => {
        const li = document.createElement("li");
        li.className = "wa-item";

        if (this.config.showTime && ev.time) {
          const t = document.createElement("span");
          t.className = "wa-time";
          t.textContent = `[${ev.time}] `;
          li.appendChild(t);
        }

        const title = document.createElement("span");
        title.className = "wa-title";
        title.textContent = ev.title;
        li.appendChild(title);
        ul.appendChild(li);
      });

      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "wa-empty";
        empty.textContent = "—";
        cell.appendChild(empty);
      } else {
        cell.appendChild(ul);
      }
      eventsRow.appendChild(cell);
    });
    grid.appendChild(eventsRow);

    wrapper.appendChild(grid);
    return wrapper;
  },

  _initEmptyWeek() {
    return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
  },

  _orderedDays() {
    const days = [
      { key: "mon", label: "Пн" },
      { key: "tue", label: "Вт" },
      { key: "wed", label: "Ср" },
      { key: "thu", label: "Чт" },
      { key: "fri", label: "Пт" },
      { key: "sat", label: "Сб" },
      { key: "sun", label: "Вс" }
    ];
    return this.config.weekStartsOnMonday ? days : [days[6]].concat(days.slice(0, 6));
  },

  _weekdayKeyFromDate(dateObj) {
    // dateObj is JS Date
    const jsDay = dateObj.getDay(); // 0=Sun..6=Sat
    const map = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
    return map[jsDay];
  },

  _groupByDay(eventList) {
    const result = this._initEmptyWeek();
    try {
      const formatTime = (date) => {
        try {
          const options = { hour: "2-digit", minute: "2-digit", hour12: false };
          return new Intl.DateTimeFormat(undefined, options).format(date);
        } catch (e) {
          const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
          return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
        }
      };

      eventList.forEach((ev) => {
        const start = new Date(Number(ev.startDate));
        const key = this._weekdayKeyFromDate(start);
        const title = ev.title || "(без названия)";
        const time = this.config.showTime ? formatTime(start) : "";
        if (result[key]) {
          result[key].push({ title, time });
        }
      });
    } catch (e) {
      Log.error("WeekAgenda grouping error: " + (e && e.message));
    }
    return result;
  }
});


