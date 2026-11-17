import { semaphoreFactory } from "./semaphore-factory-initial-config.js";

async function* readLines(): AsyncIterable<string> {
    yield "first line";
    yield "second line";
}

const semaphore = semaphoreFactory.create("report", {
    limit: 2,
});

// A slot stays acquired until this loop ends, even when it stops early.
for await (const line of semaphore.runStream(readLines())) {
    console.log(line);
}
