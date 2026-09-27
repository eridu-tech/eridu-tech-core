import { describe, expect, test } from "vitest";

import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module-exports.js";
import { flexibleSerdeAdapterTestSuite } from "@/serde/implementations/test-utilities/_module-exports.js";

describe("class: SuperJsonSerdeAdapter", () => {
    flexibleSerdeAdapterTestSuite({
        createAdapter: () => new SuperJsonSerdeAdapter(),
        expect,
        test,
    });
});
