import { ListCollection } from "eridu-tech/collection";

new ListCollection(["a", "b", "b", "c"]).searchLast((item) => item === "b");
// 2
