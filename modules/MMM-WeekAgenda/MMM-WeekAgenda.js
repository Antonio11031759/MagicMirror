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
    wrapper.className = "wa-vertical";

    const week = this._currentWeekDays();
    // Re-group strictly for the visible week (ensures no "перемешано")
    this.days = this._groupByDayForWeek(this.events, week);

    week.forEach((day) => {
      const block = document.createElement("div");
      block.className = "wa-day";

      const header = document.createElement("div");
      header.className = "wa-day-header";
      header.textContent = `${day.label} (${day.dateLabel})`;
      block.appendChild(header);

      const items = (this.days[day.key] || []).slice(0, this.config.maxPerDay);
      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "wa-empty";
        empty.textContent = "нет ничего";
        block.appendChild(empty);
      } else {
        const ul = document.createElement("ul");
        items.forEach((ev) => {
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
        block.appendChild(ul);
      }

      wrapper.appendChild(block);
    });

    return wrapper;
  },

  _initEmptyWeek() {
    return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
  },

  _orderedDays() {
    const days = [
      { key: "mon", label: "Понедельник" },
      { key: "tue", label: "Вторник" },
      { key: "wed", label: "Среда" },
      { key: "thu", label: "Четверг" },
      { key: "fri", label: "Пятница" },
      { key: "sat", label: "Суббота" },
      { key: "sun", label: "Воскресенье" }
    ];
    return this.config.weekStartsOnMonday ? days : [days[6]].concat(days.slice(0, 6));
  },

  _currentWeekDays() {
    const today = new Date();
    const jsDay = today.getDay(); // 0=Sun..6=Sat
    const mondayOffset = this.config.weekStartsOnMonday ? ((jsDay + 6) % 7) : jsDay;
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(today.getDate() - mondayOffset);

    const result = [];
    const days = this._orderedDays();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dd = (n) => (n < 10 ? `0${n}` : `${n}`);
      const dateLabel = `${dd(d.getDate())}.${dd(d.getMonth() + 1)}.${d.getFullYear()}`;
      result.push({ key: days[i].key, label: days[i].label, dateObj: d, dateLabel });
    }
    return result;
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
      // sort items in each day by time asc
      Object.keys(result).forEach((k) => {
        result[k].sort((a, b) => {
          if (!a.time && !b.time) return 0;
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });
      });
    } catch (e) {
      Log.error("WeekAgenda grouping error: " + (e && e.message));
    }
    return result;
  }

  ,_groupByDayForWeek(eventList, weekDays) {
    // Build a map of YYYY-MM-DD -> dayKey for the visible week
    const dayMap = {};
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    weekDays.forEach((d) => {
      const ds = `${d.dateObj.getFullYear()}-${pad(d.dateObj.getMonth() + 1)}-${pad(d.dateObj.getDate())}`;
      dayMap[ds] = d.key;
    });

    const result = this._initEmptyWeek();
    const toDayString = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const formatTime = (date) => {
      try {
        const options = { hour: "2-digit", minute: "2-digit", hour12: false };
        return new Intl.DateTimeFormat(undefined, options).format(date);
      } catch (e) {
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
      }
    };

    try {
      eventList.forEach((ev) => {
        const start = new Date(Number(ev.startDate));
        const dayStr = toDayString(start);
        const key = dayMap[dayStr];
        if (!key) return; // skip events outside the visible week
        const title = ev.title || "(без названия)";
        const time = this.config.showTime ? formatTime(start) : "";
        result[key].push({ title, time });
      });
      // sort within each day by time asc
      Object.keys(result).forEach((k) => {
        result[k].sort((a, b) => {
          if (!a.time && !b.time) return 0;
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });
      });
    } catch (e) {
      Log.error("WeekAgenda week-grouping error: " + (e && e.message));
    }
    return result;
  }
});


