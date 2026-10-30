import { ListCollection } from "eridu-tech/collection";

new ListCollection("AABBCCCD")
    .chunkWhile((item, _index, chunk) => item === chunk.last())
    .map((chunk) => chunk.toArray())
    .toArray();
// [["A", "A"], ["B", "B"], ["C", "C", "C"], ["D"]]
