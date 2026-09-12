import { ListCollection } from "eridu-tech/collection";

new ListCollection([
    ["a", "b"],
    ["c", "d"],
])
    .flatMap((item) => [item.length, ...item])
    .toArray();
// [2, "a", "b", 2, "c", "d"]
