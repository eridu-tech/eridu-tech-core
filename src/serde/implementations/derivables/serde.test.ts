import { describe, test, expect } from "vitest";

import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module-exports.js";
import { Serde } from "@/serde/implementations/derivables/serde.js";
import { flexibleSerdeTestSuite } from "@/serde/implementations/test-utilities/_module-exports.js";

describe("class: Serde", () => {
    flexibleSerdeTestSuite({
        createSerde: () => new Serde(new SuperJsonSerdeAdapter()),
        test,
        expect,
    });
});
