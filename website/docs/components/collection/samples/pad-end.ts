import { ListCollection } from "eridu-tech/collection";

new ListCollection("abc").padEnd(10, "foo").join("");
// "abcfoofoof"
