"use strict"

const moment = require("moment")

const Interval = require("./interval")
const Calendar = require("./calendar")

const ISO_FORMAT = "YYYY-MM-DD"

// A dictionary used to match rule measures to rule types
const ruleTypes = {
  days: "interval",
  weeks: "interval",
  months: "interval",
  years: "interval",
  daysOfWeek: "calendar",
  daysOfMonth: "calendar",
  weeksOfMonth: "calendar",
  weeksOfMonthByDay: "calendar",
  weeksOfYear: "calendar",
  monthsOfYear: "calendar"
}

// a dictionary of plural and singular measures
const measures = {
  days: "day",
  weeks: "week",
  months: "month",
  years: "year",
  daysOfWeek: "dayOfWeek",
  daysOfMonth: "dayOfMonth",
  weeksOfMonth: "weekOfMonth",
  weeksOfMonthByDay: "weekOfMonthByDay",
  weeksOfYear: "weekOfYear",
  monthsOfYear: "monthOfYear"
}

const recurPattern = {
  index: 0,
  pattern: null,
  _interval: null,
  rules: [],

  set interval(rule) {
    const keys = Object.keys(rule.units)

    this._interval = {
      measure: rule.measure,
      unit: keys[0]
    }
  },

  get interval() {
    return this._interval
  },

  get measure() {
    return ruleTypes[this.rules[0].measure]
  },

  nextDate(workingDate) {
    let day

    if (this.measure === "daysOfMonth") {
      if (this.index >= this.pattern.length) {
        workingDate.add(1, "month")
        this.index = 0
      }
      day = this.pattern[this.index]

      workingDate.date(day)
    } else if (this.measure === "daysOfWeek") {
      // Sunday = 0, Saturday = 6
      if (this.index >= this.pattern.length) {
        workingDate.add(this.interval.unit, this.interval.measure)
        this.index = 0
      }
      day = this.pattern[this.index]

      workingDate.day(day)
    }

    this.index++
  },

  rebuild(rules) {
    this.reset()

    this.rules = rules

    let days

    if (rules.length === 1 && this.measure === "daysOfMonth") {
      // Populate with the days in the rule (e.g. 1, 5, 31)
      days = Object.keys(rules)

      // Set up the pattern
      if (days && days.length > 0) {
        this.pattern = days
      }
    } else if ((rules.length === 1 || rules.length === 2) && this.measure === "daysOfWeek") {
      // Populate with the days of the week in the rule (e.g. 0, 1, 7)
      days = Object.keys(rules)

      // Set up the pattern
      if (days && days.length > 0) {
        this.pattern = days
      }
      if (rules.length === 1) {
        this.interval = {
          units: { 1: true },
          measure: "weeks"
        }
      } else {
        this.interval = rules[1]
      }
    }
  },

  reset() {
    this.index = 0
    this.pattern = null
  }
}

function getNextDate(currentDate, type) {
  if (type === "all") {
    if (recurPattern.pattern !== null) {
      recurPattern.nextDate(currentDate)
    } else {
      currentDate.add(1, "day")
    }
  } else if (type === "next") {
    currentDate.add(1, "day")
  } else {
    currentDate.subtract(1, "day")
  }
}

// Private function to see if a date is within range of start/end
function inRange(start, end, date) {
  if (start && date.isBefore(start)) {
    return false
  }
  if (end && date.isAfter(end)) {
    return false
  }
  return true
}

// Private function to turn units into objects
function unitsToObject(units) {
  let list = {}

  if (Array.isArray(units)) {
    units.forEach((v) => {
      list[v] = true
    })
  } else if (units === Object(units)) {
    list = units
  } else if (typeof units === "number" || typeof units === "string") {
    list[units] = true
  } else {
    throw new Error("Provide an array, object, string or number when passing units!")
  }

  return list
}

// Private function to check if a date is an exception
function isException(exceptions, date) {
  for (let i = 0, len = exceptions.length; i < len; i++) {
    if (moment(exceptions[i]).isSame(date)) {
      return true
    }
  }
  return false
}

// Private function to see if all rules match
function matchAllRules(rules, date, start) {
  let i, len, rule, type

  for (i = 0, len = rules.length; i < len; i++) {
    rule = rules[i]
    type = ruleTypes[rule.measure]

    if (type === "interval") {
      if (!Interval.match(rule.measure, rule.units, start, date)) {
        return false
      }
    } else if (type === "calendar") {
      if (!Calendar.match(rule.measure, rule.units, date)) {
        return false
      }
    } else {
      return false
    }
  }

  return true
}

// Private function to create measure functions
function createMeasure(measure) {
  return function createMeasure$bound(units) {
    this.every(units, measure)
    return this
  }
}

const plurals = {
  day: "days",
  week: "weeks",
  month: "months",
  year: "years",
  dayOfWeek: "daysOfWeek",
  dayOfMonth: "daysOfMonth",
  weekOfMonth: "weeksOfMonth",
  weekOfMonthByDay: "weeksOfMonthByDay",
  weekOfYear: "weeksOfYear",
  monthOfYear: "monthsOfYear"
}

// Private function to pluralize measure names for use with dictionaries.
function pluralize(measure) {
  return plurals[measure] || measure
}

/////////////////////////////////
// Private Methods             //
// Must be called with .call() //
/////////////////////////////////

// Private method that tries to set a rule.
function trigger() {
  let rule
  const ruleType = ruleTypes[this.measure]

  // Make sure units and measure is defined and not null
  if (this.units == null || !this.measure) {
    return this
  }

  // Error if we don't have a valid ruleType
  if (ruleType !== "calendar" && ruleType !== "interval") {
    throw new Error(`Invalid measure provided: ${this.measure}`)
  }

  // Create the rule
  if (ruleType === "interval") {
    if (!this.start) {
      throw new Error("Must have a start date set to set an interval!")
    }

    rule = Interval.create(this.units, this.measure)
  }

  if (ruleType === "calendar") {
    rule = Calendar.create(this.units, this.measure)
  }

  // Remove the temporary rule data
  this.units = null
  this.measure = null

  if (rule.measure === "weeksOfMonthByDay" && !this.hasRule("daysOfWeek")) {
    throw new Error("weeksOfMonthByDay must be combined with daysOfWeek")
  }

  // Remove existing rule based on measure
  for (let i = 0; i < this.rules.length; i++) {
    if (this.rules[i].measure === rule.measure) {
      this.rules.splice(i, 1)
    }
  }

  this.rules.push(rule)
  return this
}

// Private method to get next, previous or all occurrences
function getOccurrences(num, format, type) {
  const dates = []

  if (!this.start && !this.from) {
    throw new Error("Cannot get occurrences without start or from date.")
  }

  if (type === "all" && !this.end) {
    throw new Error("Cannot get all occurrences without an end date.")
  }

  if (!!this.end && (this.start > this.end)) {
    throw new Error("Start date cannot be later than end date.")
  }

  // Return empty set if the caller doesn't want any for next/prev
  if (type !== "all" && !(num > 0)) {
    return dates
  }

  // Start from the from date, or the start date if from is not set.
  const currentDate = (this.from || this.start).clone()

  // Reset the pattern builder, which dramatically speeds up queries
  recurPattern.rebuild(this.rules)

  // Include the initial date to the results if wanting all dates
  if (type === "all") {
    if (this.matches(currentDate, false)) {
      const date = format ? currentDate.format(format) : currentDate.clone()

      dates.push(date)
    }
  }

  // Get the next N dates, if num is null then infinite
  while (dates.length < (num == null ? dates.length + 1 : num)) {
    getNextDate(currentDate, type)

    // Don't match outside the date if generating all dates within start/end
    if (this.matches(currentDate, type !== "all")) {
      const date = format ? currentDate.format(format) : currentDate.clone()

      dates.push(date)
    }

    // when searching for "all" or "next" dates, if the end date occurs prior to next date, exit the loop
    if (currentDate >= this.end) {
      break
    }
  }

  return dates
}

class Recur {
  constructor(options) {
    if (options.start) {
      this.start = moment(options.start, ISO_FORMAT).dateOnly()
    }

    if (options.end) {
      this.end = moment(options.end, ISO_FORMAT).dateOnly()
    }

    // Our list of rules, all of which must match
    this.rules = options.rules || []

    // Our list of exceptions. Match always fails on these dates.
    const exceptions = options.exceptions || []

    this.exceptions = []
    for (let i = 0; i < exceptions.length; i++) {
      this.except(exceptions[i])
    }

    // Temporary units integer, array, or object. Does not get imported/exported.
    this.units = null

    // Tempoarary measure type. Does not get imported/exported.
    this.measure = null

    // Tempoarary from date for next/previous. Does not get imported/exported.
    this.from = null
  }

  startDate(date) {
    if (date === null) {
      this.start = null
      return this
    }

    if (date) {
      this.start = moment(date, ISO_FORMAT).dateOnly()
      return this
    }

    return this.start
  }

  endDate(date) {
    if (date === null) {
      this.end = null
      return this
    }

    if (date) {
      this.end = moment(date, ISO_FORMAT).dateOnly()
      return this
    }

    return this.end
  }

  // Return boolean value based on whether this date repeats (has rules or not)
  repeats() {
    return this.rules.length > 0
  }

  // Get/Set a temporary from date
  fromDate(date) {
    if (date === null) {
      this.from = null
      return this
    }

    if (date) {
      this.from = moment(date, ISO_FORMAT).dateOnly()
      return this
    }

    return this.from
  }

  // Export the settings, rules, and exceptions of this recurring date
  save() {
    const data = {}

    if (this.start && moment(this.start, ISO_FORMAT).isValid()) {
      data.start = this.start.format(ISO_FORMAT)
    }

    if (this.end && moment(this.end, ISO_FORMAT).isValid()) {
      data.end = this.end.format(ISO_FORMAT)
    }

    data.exceptions = []
    for (let i = 0, len = this.exceptions.length; i < len; i++) {
      data.exceptions.push(this.exceptions[i].format(ISO_FORMAT))
    }

    data.rules = this.rules

    return data
  }

  // Set the units and, optionally, the measure
  every(units, measure) {
    if (units != null) {
      this.units = unitsToObject(units)
    }

    if (measure != null) {
      this.measure = pluralize(measure)
    }

    return trigger.call(this)
  }

  // Creates an exception date to prevent matches, even if rules match
  except(date) {
    const d = moment(date, ISO_FORMAT).dateOnly()

    this.exceptions.push(d)
    return this
  }

  // Forgets rules (by passing measure) and exceptions (by passing date)
  forget(dateOrRule) {
    let i, len
    let whatMoment = moment(dateOrRule, ISO_FORMAT)

    // If valid date, try to remove it from exceptions
    if (whatMoment.isValid()) {
      // change to date only for perfect comparison
      whatMoment = whatMoment.dateOnly()

      for (i = 0, len = this.exceptions.length; i < len; i++) {
        if (whatMoment.isSame(this.exceptions[i])) {
          this.exceptions.splice(i, 1)
          return this
        }
      }

      return this
    }

    // Otherwise, try to remove it from the rules
    for (i = 0, len = this.rules.length; i < len; i++) {
      if (this.rules[i].measure === pluralize(dateOrRule)) {
        this.rules.splice(i, 1)
      }
    }
  }

  // Checks if a rule has been set on the chain
  hasRule(measure) {
    let i, len

    for (i = 0, len = this.rules.length; i < len; i++) {
      if (this.rules[i].measure === pluralize(measure)) {
        return true
      }
    }
    return false
  }

  // Attempts to match a date to the rules
  matches(dateToMatch, ignoreStartEnd) {
    const date = moment(dateToMatch, ISO_FORMAT).dateOnly()

    if (!date.isValid()) {
      throw new Error(`Invalid date supplied to match method: ${dateToMatch}`)
    }

    if (!ignoreStartEnd && !inRange(this.start, this.end, date)) {
      return false
    }

    if (isException(this.exceptions, date)) {
      return false
    }

    if (!matchAllRules(this.rules, date, this.start)) {
      return false
    }

    // if we passed everything above, then this date matches
    return true
  }

  // Get next N occurances
  next(num, format) {
    return getOccurrences.call(this, num, format, "next")
  }

  // Get previous N occurances
  previous(num, format) {
    return getOccurrences.call(this, num, format, "previous")
  }

  // Get all occurances between start and end date
  all(format) {
    return getOccurrences.call(this, null, format, "all")
  }
}

// Create the measure functions (days(), months(), daysOfMonth(), monthsOfYear(), etc.)
for (const measure in measures) {
  if (ruleTypes.hasOwnProperty(measure)) {
    Recur.prototype[measure] = Recur.prototype[measures[measure]] = createMeasure(measure)
  }
}

module.exports = Recur
