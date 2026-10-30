import { ListCollection } from "eridu-tech/collection";

new ListCollection(["a", "a", "a", "b", "b", "c"]).countBy().toArray();
// [["a", 3], ["b", 2], ["c", 1]]
