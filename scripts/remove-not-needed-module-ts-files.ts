import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

const srcDir = "src";

console.log("start:");

const entries = await readdir(srcDir, { withFileTypes: true });

for (const entry of entries) {
    if (!entry.isDirectory()) {
        continue;
    }

    const moduleTsFilePath = join(
        srcDir,
        entry.name,
        "implementations",
        "adapters",
        "_module.ts",
    );

    try {
        await unlink(moduleTsFilePath);
        console.log(`removed: ${moduleTsFilePath}`);
    } catch (error) {
        // Ignore files that don't exist, rethrow anything else.
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
        }
    }
}

console.log("end:");
