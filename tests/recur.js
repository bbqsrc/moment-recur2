/* eslint-env node, mocha */
"use strict"

require("moment-timezone")
const expect = require("chai").expect
const moment = require("../../moment-recur")

// TOTEST:
// Export Rules
// Repeats function

const startDate = "01/01/2013"
const endDate = "01/01/2014"
const FORMAT = "MM/DD/YYYY"
const ISO_FMT = "YYYY-MM-DD"

describe("Creating a recurring moment", function() {
  const nowMoment = moment()
  const nowDate = nowMoment.format("L")

  it("from moment constructor, with options parameter - moment.recur(options)", function() {
    const recur = moment.recur({ start: startDate, end: endDate })

    expect(recur.start.format("L")).to.equal(startDate)
    expect(recur.end.format("L")).to.equal(endDate)
  })

  it("from moment constructor, with start parameter only - moment.recur(start)", function() {
    const recur = moment.recur(startDate)

    expect(recur.start.format("L")).to.equal(startDate)
  })

  it("from moment constructor, with start and end parameters - moment.recur(start, end)", function() {
    const recur = moment.recur(startDate, endDate)

    expect(recur.start.format("L")).to.equal(startDate)
    expect(recur.end.format("L")).to.equal(endDate)
  })

  it("from moment function, with options parameter - moment().recur(options)", function() {
    const recur = moment().recur({ start: startDate, end: endDate })

    expect(recur.start.format("L")).to.equal(startDate)
    expect(recur.end.format("L")).to.equal(endDate)
  })

  it("from moment function, with start and end parameters - moment().recur(start, end)", function() {
    const recur = moment().recur(startDate, endDate)

    expect(recur.start.format("L")).to.equal(startDate)
    expect(recur.end.format("L")).to.equal(endDate)
  })

  it("from moment function, with starting moment and end parameter - moment(start).recur(end)", function() {
    const recur = moment(startDate, FORMAT).recur(endDate)

    expect(recur.start.format("L")).to.equal(startDate)
    expect(recur.end.format("L")).to.equal(endDate)
  })

  it("from moment function, starting now, with end parameter  - moment().recur(end)", function() {
    const recur = nowMoment.recur(endDate)

    expect(recur.start.format("L")).to.equal(nowDate)
    expect(recur.end.format("L")).to.equal(endDate)
  })

  it("from moment function, starting now - moment().recur()", function() {
    const recur = nowMoment.recur()

    expect(recur.start.format("L")).to.equal(nowDate)
  })

  it("from moment function, with starting moment and end parameter, which is a moment object - moment(start).recur(end)", function() {
    const startMoment = moment(startDate, FORMAT)
    const endMoment = moment(endDate, FORMAT)
    const recur = moment(startMoment, FORMAT).recur(endMoment)

    expect(recur.start.format("L")).to.equal(startDate)
    expect(recur.end.format("L")).to.equal(endDate)
  })
})

describe("Setting", function() {
  let recur

  beforeEach(function() {
    recur = moment().recur()
  })

  it("'start' should be getable/setable with startDate()", function() {
    recur.startDate(startDate)
    expect(recur.startDate().format("L")).to.equal(startDate)
  })

  it("'end' should be getable/setable with endDate()", function() {
    recur.endDate(endDate)
    expect(recur.endDate().format("L")).to.equal(endDate)
  })

  it("'from' should be getable/setable with fromDate()", function() {
    recur.fromDate(startDate)
    expect(recur.fromDate().format("L")).to.equal(startDate)
  })
})

describe("The every() function", function() {
  it("should create a rule when a unit and measurement is passed", function() {
    const recurrence = moment().recur().every(1, "day")

    expect(recurrence.save().rules.length).to.equal(1)
  })

  it("should not create a rule when only a unit is passed", function() {
    const recurrence = moment().recur().every(1)

    expect(recurrence.save().rules.length).to.equal(0)
  })

  it("should set the temporary units property", function() {
    const recurrence = moment().recur().every(1)

    expect(recurrence.units).not.to.equal(null)
  })

  it("should accept an array", function() {
    const recurrence = moment().recur().every([1, 2])

    expect(recurrence.units).not.to.equal(null)
  })
})

describe("An interval", function() {
  it("should not match a date before the start date", function() {
    const start = moment(startDate, FORMAT)
    const before = start.clone().subtract(1, "day")
    const recurrence = start.recur()

    recurrence.every(1, "day")
    expect(recurrence.matches(before)).to.equal(false)
  })

  it("should not match a date after the end date", function() {
    const start = moment(startDate, FORMAT)
    const after = moment(endDate, FORMAT).add(1, "day")
    const recurrence = start.recur()

    recurrence.endDate(endDate).every(1, "day")
    expect(recurrence.matches(after)).to.equal(false)
  })

  it("can be daily", function() {
    const recurrence = moment(startDate, FORMAT).recur().every(2).days()

    expect(recurrence.matches(moment(startDate, FORMAT).add(2, "days"))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).add(3, "days"))).to.equal(false)
  })

  it("can be weekly", function() {
    const recurrence = moment(startDate, FORMAT).recur().every(2).weeks()

    expect(recurrence.matches(moment(startDate, FORMAT).add(2, "weeks"))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).add(2, "days"))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).add(3, "weeks"))).to.equal(false)
  })

  it("can be monthly", function() {
    const recurrence = moment(startDate, FORMAT).recur().every(3).month()
    const check = moment(startDate, FORMAT).add(3, "month")

    expect(recurrence.matches(check)).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).add(2, "month"))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).add(2, "day"))).to.equal(false)
  })

  it("can be yearly", function() {
    const recurrence = moment(startDate, FORMAT).recur().every(2).years()

    expect(recurrence.matches(moment(startDate, FORMAT).add(2, "year"))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).add(3, "year"))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).add(2, "days"))).to.equal(false)
  })

  it("can be an array of intervals", function() {
    const recurrence = moment(startDate, FORMAT).recur().every([3, 5]).days()

    expect(recurrence.matches(moment(startDate, FORMAT).add(3, "days"))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).add(5, "days"))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).add(10, "days"))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).add(4, "days"))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).add(8, "days"))).to.equal(false)
  })
})

describe("The Calendar Interval", function() {
  describe("daysOfWeek", function() {
    it("should work", function() {
      const recurrence = moment.recur().every(["Sunday", 1]).daysOfWeek()

      expect(recurrence.matches(moment().day("Sunday"))).to.equal(true)
      expect(recurrence.matches(moment().day(1))).to.equal(true)
      expect(recurrence.matches(moment().day(3))).to.equal(false)
    })

    it("should work with timezones", function() {
      const recurrence = moment.tz("2015-01-25", ISO_FMT, "America/Vancouver").recur().every(["Sunday", 1]).daysOfWeek()
      const check = moment.tz("2015-02-01", ISO_FMT, "Asia/Hong_Kong")

      expect(recurrence.matches(check)).to.equal(true)
    })
  })

  it("daysOfMonth should work", function() {
    const recurrence = moment("2015-01-01", ISO_FMT).recur().every([1, 10]).daysOfMonth()

    expect(recurrence.matches(moment("2015-01-01", ISO_FMT))).to.equal(true)
    expect(recurrence.matches(moment("2015-01-02", ISO_FMT))).to.equal(false)
    expect(recurrence.matches(moment("2015-01-10", ISO_FMT))).to.equal(true)
    expect(recurrence.matches(moment("2015-01-15", ISO_FMT))).to.equal(false)
    expect(recurrence.matches(moment("2015-02-01", ISO_FMT))).to.equal(true)
    expect(recurrence.matches(moment("2015-02-02", ISO_FMT))).to.equal(false)
    expect(recurrence.matches(moment("2015-02-10", ISO_FMT))).to.equal(true)
    expect(recurrence.matches(moment("2015-02-15", ISO_FMT))).to.equal(false)
  })

  it("weeksOfMonth should work", function() {
    const recurrence = moment.recur().every([1, 3]).weeksOfMonth()

    expect(recurrence.matches(moment(startDate, FORMAT).date(6))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).date(26))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).date(27))).to.equal(false)
  })

  it("weeksOfYear should work", function() {
    const recurrence = moment.recur().every(20).weekOfYear()

    expect(recurrence.matches(moment("05/14/2014", FORMAT))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT))).to.equal(false)
  })

  it("monthsOfYear should work", function() {
    const recurrence = moment.recur().every("January").monthsOfYear()

    expect(recurrence.matches(moment().month("January"))).to.equal(true)
    expect(recurrence.matches(moment().month("February"))).to.equal(false)
  })

  it("rules can be combined", function() {
    const valentines = moment.recur().every(14).daysOfMonth()
        .every("February").monthsOfYear()

    expect(valentines.matches(moment("02/14/2014", FORMAT))).to.equal(true)
    expect(valentines.matches(moment(startDate, FORMAT))).to.equal(false)
  })

  it("can be passed units, without every()", function() {
    const recurrence = moment.recur().daysOfMonth([1, 3])

    expect(recurrence.matches("01/01/2014")).to.equal(true)
    expect(recurrence.matches("01/03/2014")).to.equal(true)
    expect(recurrence.matches("01/06/2014")).to.equal(false)
  })
})

describe("Rules", function() {
  it("should be overridden when duplicated", function() {
    const recurrence = moment("01/01/2014", FORMAT).recur().every(1).day()

    recurrence.every(2).days()
    expect(recurrence.rules.length).to.equal(1)
  })

  it("should be forgettable", function() {
    const recurrence = moment("01/01/2014", FORMAT).recur().every(1).day()

    recurrence.forget("days")
    expect(recurrence.rules.length).to.equal(0)
  })

  it("should be possible to see if one exists", function() {
    const recurrence = moment("01/01/2014", FORMAT).recur().every(1).day()

    expect(recurrence.hasRule("days")).to.equal(true)
    expect(recurrence.hasRule("month")).to.equal(false)
  })
})

describe("weeksOfMonthByDay()", function() {
  it("can recur on the 1st and 3rd Sundays of the month", function() {
    const recurrence = moment.recur()
        .every(["Sunday"]).daysOfWeek()
        .every([0, 2]).weeksOfMonthByDay()

    expect(recurrence.matches(moment(startDate, FORMAT))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).date(6))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).date(8))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).date(13))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).date(20))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).date(27))).to.equal(false)
  })

  it("can recur on the 2nd, 4th and 5th Sundays and Thursdays of the month", function() {
    const recurrence = moment.recur()
        .every(["Sunday", "Thursday"]).daysOfWeek()
        .every([1, 3, 4]).weeksOfMonthByDay()

    expect(recurrence.matches(moment(startDate, FORMAT).date(6))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).date(13))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).date(20))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).date(27))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).date(3))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).date(10))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).date(17))).to.equal(false)
    expect(recurrence.matches(moment(startDate, FORMAT).date(24))).to.equal(true)
    expect(recurrence.matches(moment(startDate, FORMAT).date(31))).to.equal(true)
  })

  it("will throw an error if used without daysOfWeek()", function() {
    expect(function() {
      moment.recur().every(0).weeksOfMonthByDay()
    }).to.throw("weeksOfMonthByDay must be combined with daysOfWeek")
  })
})

describe("Future Dates", function() {
  it("can be generated", function() {
    const recurrence = moment("01/01/2014", FORMAT).recur().every(2).days()
    const nextDates = recurrence.next(3, "L")

    expect(nextDates.length).to.equal(3)
    expect(nextDates[0]).to.equal("01/03/2014")
    expect(nextDates[1]).to.equal("01/05/2014")
    expect(nextDates[2]).to.equal("01/07/2014")
  })

  it("can start from a temporary 'from' date", function() {
    const recurrence = moment("01/01/2014", FORMAT).recur().every(2)
      .days().fromDate("02/05/2014")
    const nextDates = recurrence.next(3, "L")

    expect(nextDates.length).to.equal(3)
    expect(nextDates[0]).to.equal("02/06/2014")
    expect(nextDates[1]).to.equal("02/08/2014")
    expect(nextDates[2]).to.equal("02/10/2014")
  })

  it("will report no date if the end date occurs prior to the next date", function() {
    const recurrence = moment().recur("01/01/2014", "01/08/2014").every(10).days()
    const nextDate = recurrence.next(1, "L")

    expect(nextDate.length).to.equal(0)
  })
})

describe("Previous Dates", function() {
  it("can be generated", function() {
    const recurrence = moment("01/01/2014", FORMAT).recur().every(2).days()
    const nextDates = recurrence.previous(3, "L")

    expect(nextDates.length).to.equal(3)
    expect(nextDates[0]).to.equal("12/30/2013")
    expect(nextDates[1]).to.equal("12/28/2013")
    expect(nextDates[2]).to.equal("12/26/2013")
  })
})

describe("All Dates", function() {
  it("can be generated", function() {
    const recurrence = moment("01/01/2014", FORMAT).recur("01/07/2014").every(2).days()
    const allDates = recurrence.all("L")

    expect(allDates.length).to.equal(4)
    expect(allDates[0]).to.equal("01/01/2014")
    expect(allDates[1]).to.equal("01/03/2014")
    expect(allDates[2]).to.equal("01/05/2014")
    expect(allDates[3]).to.equal("01/07/2014")
  })

  it("can start from a temporary 'from' date", function() {
    const recurrence = moment().recur("01/01/2014", "01/08/2014").every(2)
      .days().fromDate("01/05/2014")
    const allDates = recurrence.all("L")

    expect(allDates.length).to.equal(2)
    expect(allDates[0]).to.equal("01/05/2014")
    expect(allDates[1]).to.equal("01/07/2014")
  })

  it("should throw error if start date is after end date", function() {
    const recurrence = moment().recur("07/26/2017", "08/01/2013").every(2).days()

    expect(function() {
      recurrence.all("L")
    }).to.throw("Start date cannot be later than end date.")
  })

  it("should only generate a single date when start date and end date are the same", function() {
    const recurrence = moment().recur("01/01/2014", "01/01/2014").every(1).days()
    const allDates = recurrence.all("L")

    expect(allDates.length).to.equal(1)
    expect(allDates[0]).to.equal("01/01/2014")
  })
})

describe("Exceptions", function() {
  let mo, exception, recur, exceptionWithTz

  beforeEach(function() {
    mo = moment(startDate, FORMAT)
    exception = mo.clone().add(3, "day")
    recur = mo.clone().recur().every(1, "days")
    exceptionWithTz = moment.tz(exception.format(ISO_FMT), "Asia/Hong_Kong")
  })

  it("should prevent exception days from matching", function() {
    recur.except(exception)
    expect(recur.matches(exception)).to.equal(false)
  })

  it("should work when the passed in exception is in a different time zone", function() {
    recur.except(exception)
    expect(recur.matches(exceptionWithTz)).to.equal(false)
  })

  it("should be removeable", function() {
    recur.except(exception)
    recur.forget(exception)
    expect(recur.matches(exception)).to.equal(true)
  })
})

describe("Exceptions with weeks", function() {
  let mo, exception, recur, exceptionWithTz

  beforeEach(function() {
    mo = moment(startDate, FORMAT)
    exception = mo.clone().add(7, "day")
    recur = mo.clone().recur().every(1, "weeks")
    exceptionWithTz = moment.tz(exception.format(ISO_FMT), "Asia/Hong_Kong")
  })

  it("should not match on the exception day", function() {
    expect(recur.matches(exception)).to.equal(true)
    recur.except(exception)
    expect(recur.matches(exception)).to.equal(false)
  })

  it("should not match on the exception day", function() {
    expect(recur.matches(exceptionWithTz)).to.equal(true)
    recur.except(exception)
    expect(recur.matches(exceptionWithTz)).to.equal(false)
  })
})

describe("Options", function() {
  it("should be importable", function() {
    const recurrence = moment().recur({
      start: "01/01/2014",
      end: "12/31/2014",
      rules: [
          { units: { 2: true }, measure: "days" }
      ],
      exceptions: ["01/05/2014"]
    })

    expect(recurrence.startDate().format("L")).to.equal("01/01/2014")
    expect(recurrence.endDate().format("L")).to.equal("12/31/2014")
    expect(recurrence.rules.length).to.equal(1)
    expect(recurrence.exceptions.length).to.equal(1)
    expect(recurrence.matches("01/03/2014")).to.equal(true)
    expect(recurrence.matches("01/05/2014")).to.equal(false)
  })

  it("should be exportable", function() {
    const recurrence = moment("01/01/2014", FORMAT).recur("12/31/2014").every(2, "days").except("01/05/2014")
    const data = recurrence.save()

    expect(data.start).to.equal("01/01/2014")
    expect(data.end).to.equal("12/31/2014")
    expect(data.exceptions[0]).to.equal("01/05/2014")
    expect(data.rules[0].units[2]).to.equal(true)
    expect(data.rules[0].measure).to.equal("days")
  })
})

describe("The repeats() function", function() {
  it("should return true when there are rules set", function() {
    const recurrence = moment().recur().every(1).days()

    expect(recurrence.repeats()).to.equal(true)
  })

  it("should return false when there are no rules set", function() {
    const recurrence = moment().recur()

    expect(recurrence.repeats()).to.equal(false)
  })
})
