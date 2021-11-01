import path from "path"
import fs from "fs"
import util from "util"

import envPaths from "env-paths"
import ical from "ical"

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
            const event = ical.parseFile(path.join(dir, file))
            console.log(event)
            this.events.push(event)
        }
    }
}

const config = JSON.parse(
    fs.readFileSync(path.join(paths.config, "config.json")).toString()
)
const accounts = []
const accountPaths = config.accounts
for (const account in accountPaths) {
    accounts.push(new Account(accountPaths[account], account))
}
