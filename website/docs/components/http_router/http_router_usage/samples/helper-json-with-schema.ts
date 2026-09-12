import { z } from "zod";

const responseSchema = z.object({ name: z.string() });

async ({ json }) => json({ name: "John" }, responseSchema);
