"use strict"

const moment = require("moment")

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
      throw new Error(`Value should be in range ${low} to ${high}`)
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

// Calendar object for creating and matching calendar-based rules
const Calendar = {
  // Create calendar rule
  create(list, measure) {
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
  },

  // Match calendar rule
  match(measure, list, date) {
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
}

module.exports = Calendar
