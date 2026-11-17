import { sharedLockFactory } from "./shared-lock-factory-initial-config.js";

async function* readLines(): AsyncIterable<string> {
    yield "first line";
    yield "second line";
}

const sharedLock = sharedLockFactory.create("report", {
    limit: 2,
});

// A reader slot stays acquired until this loop ends, even when it stops early.
for await (const line of sharedLock.runReaderStream(readLines())) {
    console.log(line);
}
