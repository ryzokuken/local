import path from "path"
import fs from "fs"
import util from "util"

import envPaths from "env-paths"
import ical from "ical"
import { Temporal, toTemporalInstant } from "@js-temporal/polyfill"

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
