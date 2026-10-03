import { LIFETIME } from "eridu-tech/di/contracts";
import { container } from "./container.js";
import { Database } from "./database.js";

container.registerFactory({
    token: Database,
    factory: () => new Database(),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

container.onInit({ db: Database }, async ({ db }) => {
    // Runs when container.init() is called
    // The container resolves the tokens passed as deps before the hook runs
    await db.connect();
    console.log("Container initialized");
});

container.onDeInit({ db: Database }, async ({ db }) => {
    // Runs when container.deInit() is called
    await db.disconnect();
    console.log("Container deinitialized");
});

// Trigger the lifecycle
await container.init();
// ... application runs ...
await container.deInit();
