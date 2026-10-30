import { lockFactory } from "./lock-factory-initial-config.js";

const lock = lockFactory.create("resource");

await lock.releaseOrFail();
