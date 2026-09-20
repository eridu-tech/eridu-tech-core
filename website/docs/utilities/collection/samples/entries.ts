import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection(["a", "b", "c", "d"]).entries().toArray();
// [[0, "a"], [1, "b"], [2, "c"], [3, "d"]]
