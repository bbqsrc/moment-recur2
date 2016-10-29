const moment = require("moment")

// Interval object for creating and matching interval-based rules
const Interval = (function() {
  function createInterval(units, measure) {
    // Make sure all of the units are integers greater than 0.
    for (const unit in units) {
      if (units.hasOwnProperty(unit)) {
        if (parseInt(unit, 10) <= 0) {
          throw new Error("Intervals must be greater than zero")
        }
      }
    }

    return {
      measure: measure.toLowerCase(),
      units: units
    }
  }

  function matchInterval(type, units, start, date) {
    // Get the difference between the start date and the provided date,
    // using the required measure based on the type of rule'
    let diff = null

    if (date.isBefore(start)) {
      diff = start.diff(date, type, true)
    } else {
      diff = date.diff(start, type, true)
    }
    if (type === "days") {
      // if we are dealing with days, we deal with whole days only.
      diff = parseInt(diff, 10)
    }

    // Check to see if any of the units provided match the date
    for (let unit in units) {
      if (units.hasOwnProperty(unit)) {
        unit = parseInt(unit, 10)

        // If the units divide evenly into the difference, we have a match
        if ((diff % unit) === 0) {
          return true
        }
      }
    }

    return false
  }

  return {
    create: createInterval,
    match: matchInterval
  }
}())

// Calendar object for creating and matching calendar-based rules
const Calendar = (function() {
  // Dictionary of unit types based on measures
  const unitTypes = {
    daysOfMonth: "date",
    daysOfWeek: "day",
    weeksOfMonth: "monthWeek",
    weeksOfMonthByDay: "monthWeekByDay",
    weeksOfYear: "weeks",
    monthsOfYear: "months"
  }

    // Dictionary of ranges based on measures
  const ranges = {
    daysOfMonth: { low: 1, high: 31 },
    daysOfWeek: { low: 0, high: 6 },
    weeksOfMonth: { low: 0, high: 4 },
    weeksOfMonthByDay: { low: 0, high: 4 },
    weeksOfYear: { low: 0, high: 52 },
    monthsOfYear: { low: 0, high: 11 }
  }

    // Private function for checking the range of calendar values
  function checkRange(low, high, list) {
    list.forEach((v) => {
      if (v < low || v > high) {
        throw new Error(`Value should be in range ${ low } to ${ high}`)
      }
    })
  }

    // Private function to convert day and month names to numbers
  function namesToNumbers(list, nameType) {
    let unit, unitInt, unitNum
    const newList = {}

    for (unit in list) {
      if (list.hasOwnProperty(unit)) {
        unitInt = parseInt(unit, 10)

        if (isNaN(unitInt)) {
          unitInt = unit
        }

        unitNum = moment().set(nameType, unitInt).get(nameType)
        newList[unitNum] = list[unit]
      }
    }

    return newList
  }

  function createCalendarRule(list, measure) {
    const keys = []
    let units = Object.assign({}, list)

    // Convert day/month names to numbers, if needed
    if (measure === "daysOfWeek") {
      units = namesToNumbers(units, "days")
    }

    if (measure === "monthsOfYear") {
      units = namesToNumbers(units, "months")
    }

    for (const key in units) {
      if (hasOwnProperty.call(units, key)) {
        keys.push(key)
      }
    }

    // Make sure the listed units are in the measure's range
    checkRange(ranges[measure].low, ranges[measure].high, keys)

    return { measure, units }
  }

  function matchCalendarRule(measure, list, date) {
    // Get the unit type (i.e. date, day, week, monthWeek, weeks, months)
    const unitType = unitTypes[measure]

    // Get the unit based on the required measure of the date
    let unit = date[unitType]()

    // If the unit is in our list, return true, else return false
    if (list[unit]) {
      return true
    }

    // match on end of month days
    if (unitType === "date" && unit === date.add(1, "months").date(0).format("D") && unit < 31) {
      while (unit <= 31) {
        if (list[unit]) {
          return true
        }
        unit++
      }
    }

    return false
  }

  return {
    create: createCalendarRule,
    match: matchCalendarRule
  }
}())

// The main Recur object to provide an interface for settings, rules, and matching
const Recur = (function() {
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

  /////////////////////////////////
  // Private Methods             //
  // Must be called with .call() //
  /////////////////////////////////

  // Private method that tries to set a rule.
  function trigger() {
    let rule
    const ruleType = ruleTypes[this.measure]

    if (!(this instanceof Recur)) {
      throw new Error("Private method trigger() was called directly or not called as instance of Recur!")
    }

        // Make sure units and measure is defined and not null
    if ((typeof this.units === "undefined" || this.units === null) || !this.measure) {
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

    if (!(this instanceof Recur)) {
      throw new Error("Private method trigger() was called directly or not called as instance of Recur!")
    }

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
    while (dates.length < (num === null ? dates.length + 1 : num)) {
      getNextDate(currentDate, type)

      // Don't match outside the date if generating all dates within start/end
      // TODO: understand why finding "next" would not take the end date into consideration
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

  ///////////////////////
  // Private Functions //
  ///////////////////////

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

    if (Object.prototype.toString.call(units) === "[object Array]") {
      units.forEach((v) => {
        list[v] = true
      })
    } else if (units === Object(units)) {
      list = units
    } else if ((Object.prototype.toString.call(units) === "[object Number]") || (Object.prototype.toString.call(units) === "[object String]")) {
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

  // Private function to pluralize measure names for use with dictionaries.
  function pluralize(measure) {
    switch (measure) {
      case "day":
        return "days"

      case "week":
        return "weeks"

      case "month":
        return "month"

      case "year":
        return "years"

      case "dayOfWeek":
        return "daysOfWeek"

      case "dayOfMonth":
        return "daysOfMonth"

      case "weekOfMonth":
        return "weeksOfMonth"

      case "weekOfMonthByDay":
        return "weeksOfMonthByDay"

      case "weekOfYear":
        return "weeksOfYear"

      case "monthOfYear":
        return "monthsOfYear"

      default:
        return measure
    }
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
    return function(units) {
      this.every(units, measure)
      return this
    }
  }


  //////////////////////
  // Public Functions //
  //////////////////////

  // Recur Object Constrcutor
  const Recur = function(options) {
    if (options.start) {
      this.start = moment(options.start, "MM/DD/YYYY").dateOnly()
    }

    if (options.end) {
      this.end = moment(options.end, "MM/DD/YYYY").dateOnly()
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

    return this
  }

  // Get/Set start date
  Recur.prototype.startDate = function(date) {
    if (date === null) {
      this.start = null
      return this
    }

    if (date) {
      this.start = moment(date, "MM/DD/YYYY").dateOnly()
      return this
    }

    return this.start
  }

  // Get/Set end date
  Recur.prototype.endDate = function(date) {
    if (date === null) {
      this.end = null
      return this
    }

    if (date) {
      this.end = moment(date, "MM/DD/YYYY").dateOnly()
      return this
    }

    return this.end
  }

  // Get/Set a temporary from date
  Recur.prototype.fromDate = function(date) {
    if (date === null) {
      this.from = null
      return this
    }

    if (date) {
      this.from = moment(date, "MM/DD/YYYY").dateOnly()
      return this
    }

    return this.from
  }

  // Export the settings, rules, and exceptions of this recurring date
  Recur.prototype.save = function() {
    const data = {}

    if (this.start && moment(this.start, "MM/DD/YYYY").isValid()) {
      data.start = this.start.format("L")
    }

    if (this.end && moment(this.end, "MM/DD/YYYY").isValid()) {
      data.end = this.end.format("L")
    }

    data.exceptions = []
    for (let i = 0, len = this.exceptions.length; i < len; i++) {
      data.exceptions.push(this.exceptions[i].format("L"))
    }

    data.rules = this.rules

    return data
  }

  // Return boolean value based on whether this date repeats (has rules or not)
  Recur.prototype.repeats = function() {
    if (this.rules.length > 0) {
      return true
    }

    return false
  }

  // Set the units and, optionally, the measure
  Recur.prototype.every = function(units, measure) {
    if ((typeof units !== "undefined") && (units !== null)) {
      this.units = unitsToObject(units)
    }

    if ((typeof measure !== "undefined") && (measure !== null)) {
      this.measure = pluralize(measure)
    }

    return trigger.call(this)
  }

  // Creates an exception date to prevent matches, even if rules match
  Recur.prototype.except = function(date) {
    date = moment(date, "MM/DD/YYYY").dateOnly()
    this.exceptions.push(date)
    return this
  }

  // Forgets rules (by passing measure) and exceptions (by passing date)
  Recur.prototype.forget = function(dateOrRule) {
    let i, len
    let whatMoment = moment(dateOrRule, "MM/DD/YYYY")

    // If valid date, try to remove it from exceptions
    if (whatMoment.isValid()) {
      whatMoment = whatMoment.dateOnly() // change to date only for perfect comparison
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
  Recur.prototype.hasRule = function(measure) {
    let i, len

    for (i = 0, len = this.rules.length; i < len; i++) {
      if (this.rules[i].measure === pluralize(measure)) {
        return true
      }
    }
    return false
  }

  // Attempts to match a date to the rules
  Recur.prototype.matches = function(dateToMatch, ignoreStartEnd) {
    const date = moment(dateToMatch, "MM/DD/YYYY").dateOnly()

    if (!date.isValid()) {
      throw new Error(`Invalid date supplied to match method: ${ dateToMatch}`)
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
  Recur.prototype.next = function(num, format) {
    return getOccurrences.call(this, num, format, "next")
  }

  // Get previous N occurances
  Recur.prototype.previous = function(num, format) {
    return getOccurrences.call(this, num, format, "previous")
  }

  // Get all occurances between start and end date
  Recur.prototype.all = function(format) {
    return getOccurrences.call(this, null, format, "all")
  }

  // Create the measure functions (days(), months(), daysOfMonth(), monthsOfYear(), etc.)
  for (const measure in measures) {
    if (ruleTypes.hasOwnProperty(measure)) {
      Recur.prototype[measure] = Recur.prototype[measures[measure]] = createMeasure(measure)
    }
  }

  return Recur
}())

// Recur can be created the following ways:
// moment.recur()
// moment.recur(options)
// moment.recur(start)
// moment.recur(start, end)
moment.recur = function(start, end) {
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
moment.fn.recur = function(start, end) {
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
  if (this.tz && typeof (moment.tz) === "function") {
    return moment.tz(this.format("YYYY-MM-DD"), "UTC")
  } else {
    return this.hours(0).minutes(0).seconds(0).milliseconds(0).add(this.utcOffset(), "minute").utcOffset(0)
  }
}

module.exports = moment
