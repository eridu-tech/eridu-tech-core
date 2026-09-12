import { ListCollection } from "eridu-tech/collection";

new ListCollection(["a", "b", "b", "c"]).searchFirst((item) => item === "b");
// 1
