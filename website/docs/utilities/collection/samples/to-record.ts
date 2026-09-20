import { ListCollection } from "eridu-tech/collection";

new ListCollection([
    [0, "a"],
    [1, "b"],
]).toRecord();
// { 0: "a", 1: "b" }
