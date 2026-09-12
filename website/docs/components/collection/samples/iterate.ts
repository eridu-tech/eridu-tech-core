import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([1, 2, 3]);

// Logs 1, 2, 3
for (const item of collection) {
    console.log(item);
}
