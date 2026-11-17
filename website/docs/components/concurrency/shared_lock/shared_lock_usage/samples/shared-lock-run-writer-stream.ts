import { sharedLockFactory } from "./shared-lock-factory-initial-config.js";

async function* readLines(): AsyncIterable<string> {
    yield "first line";
    yield "second line";
}

const sharedLock = sharedLockFactory.create("report", {
    limit: 2,
});

// The shared-lock stays acquired as writer until this loop ends, even when it stops early.
for await (const line of sharedLock.runWriterStream(readLines())) {
    console.log(line);
}
