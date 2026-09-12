import { ListCollection } from "eridu-tech/collection";

const fromString = new ListCollection("abc");
// Logs ["a", "b", "c"]
console.log(fromString.toArray());
