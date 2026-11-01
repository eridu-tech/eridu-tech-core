import { ListCollection } from "eridu-tech/collection";

new ListCollection(["a", "a", "a", "b", "b", "c"])
    .groupBy()
    .map(([k, v]) => [k, v.toArray()])
    .toArray();
// [["a", ["a", "a", "a"]], ["b", ["b", "b"]], ["c", ["c"]]]
