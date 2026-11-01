import { lockFactory } from "./lock-factory-initial-config.js";

export const lock = lockFactory.create("shared-resource");
