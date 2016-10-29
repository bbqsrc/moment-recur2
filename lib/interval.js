"use strict"

// Interval object for creating and matching interval-based rules
const Interval = {
  create(units, measure) {
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
  },

  match(type, units, start, date) {
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
}

module.exports = Interval
