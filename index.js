const path = require("path")
const fs = require("fs")
const util = require("util")

const envPaths = require("fix-esm").require("env-paths").default
const ical = require("ical")
const { Temporal, toTemporalInstant } = require("@js-temporal/polyfill")
const { app, BrowserWindow } = require("electron")

const paths = envPaths("local")

class Account {
    constructor(dir, id) {
        this.id = id
        this.calendars = []
        const calendars = fs.readdirSync(dir)
        for (const calendar of calendars) {
            this.calendars.push(
                new Calendar(path.join(dir, calendar), calendar)
            )
        }
    }
}

class Calendar {
    constructor(dir, id) {
        this.id = id
        const files = fs.readdirSync(dir)
        if (files.includes("displayname"))
            this.displayName = fs
                .readFileSync(path.join(dir, "displayname"))
                .toString()
        if (files.includes("color"))
            this.color = fs.readFileSync(path.join(dir, "color")).toString()
        this.events = []
        for (const file of files) {
            if (!file.endsWith(".ics")) continue
            const parsed = ical.parseFile(path.join(dir, file))
            for (const item in parsed) {
                this.events.push(processItem(parsed[item]))
            }
        }
    }
}

function processItem(item) {
    switch (item.type) {
        case "VEVENT":
            return new Event(item)
    }
}

class Event {
    constructor(event) {
        this.raw = event
        this.start = processDate(event.start)
        this.end = processDate(event.end)
        this.uid = event.uid
        this.summary = event.summary
    }
}

function processDate(date) {
    const timeZone = date.tz
    return toTemporalInstant
        .call(date)
        .toZonedDateTimeISO(timeZone || "Etc/UTC")
}

const config = JSON.parse(
    fs.readFileSync(path.join(paths.config, "config.json")).toString()
)
const accounts = []
const accountPaths = config.accounts
for (const account in accountPaths) {
    accounts.push(new Account(accountPaths[account], account))
}
console.log(util.inspect(accounts, { depth: 5 }))

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
    })
    win.loadFile("index.html")
}

app.whenReady().then(() => {
    createWindow()
})
