import { lockFactory } from "./lock-factory-initial-config.js";

async function* readLines(): AsyncIterable<string> {
    yield "first line";
    yield "second line";
}

const lock = lockFactory.create("report");

// The lock stays acquired until this loop ends, even when it stops early.
for await (const line of lock.runStream(readLines())) {
    console.log(line);
}
