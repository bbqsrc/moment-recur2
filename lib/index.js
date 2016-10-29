"use strict"

const moment = require("moment")
const Recur = require("./recur")

// Recur can be created the following ways:
// moment.recur()
// moment.recur(options)
// moment.recur(start)
// moment.recur(start, end)
moment.recur = function recur(start, end) {
    // If we have an object, use it as a set of options
  if (start === Object(start) && !moment.isMoment(start)) {
    return new Recur(start)
  }

    // else, use the values passed
  return new Recur({ start, end })
}

// Recur can also be created the following ways:
// moment().recur()
// moment().recur(options)
// moment().recur(start, end)
// moment(start).recur(end)
// moment().recur(end)
moment.fn.recur = function recur(start, end) {
  // If we have an object, use it as a set of options
  if (start === Object(start) && !moment.isMoment(start)) {
    // if we have no start date, use the moment
    if (typeof start.start === "undefined") {
      start.start = this
    }

    return new Recur(start)
  }

  let e = end
  let s = start

  // if there is no end value, use the start value as the end
  if (!e) {
    e = s
    s = null
  }

  // use the moment for the start value
  if (!s) {
    s = this
  }

  return new Recur({ start: s, end: e, moment: this })
}

// Plugin for calculating the week of the month of a date
moment.fn.monthWeek = function() {
  // First day of the first week of the month
  const week0 = this.clone().startOf("month").startOf("week")

  // First day of week
  const day0 = this.clone().startOf("week")

  return day0.diff(week0, "weeks")
}

// Plugin for calculating the occurrence of the day of the week in the month.
// Similar to `moment().monthWeek()`, the return value is zero-indexed.
// A return value of 2 means the date is the 3rd occurence of that day
// of the week in the month.
moment.fn.monthWeekByDay = function monthWeekByDay() {
  // date obj
  const day = this.clone()

  // First day of the first week of the month
  const week0 = this.clone().startOf("month").startOf("week")

  // First day of week
  const day0 = this.clone().startOf("week")

  const diff = day0.diff(week0, "weeks")

  if (day.subtract(diff, "weeks").month() === this.clone().month()) {
    return diff
  }

  return diff - 1
}

// Plugin for removing all time information from a given date
moment.fn.dateOnly = function dateOnly() {
  return moment.utc(this.format("YYYY-MM-DD"), "YYYY-MM-DD")
}

module.exports = moment
