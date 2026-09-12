import { ListCollection } from "eridu-tech/collection";

const fromMap = new ListCollection(
    new Map([
        ["a", 1],
        ["b", 2],
    ]),
);
// Logs [["a", 1], ["b", 2]]
console.log(fromMap.toArray());
