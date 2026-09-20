import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2]).crossJoin(["a", "b"]).toArray();
// [[1, "a"], [1, "b"], [2, "a"], [2, "b"]]
