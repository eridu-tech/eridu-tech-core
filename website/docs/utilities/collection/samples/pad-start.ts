import { ListCollection } from "eridu-tech/collection";

new ListCollection("abc").padStart(10, "foo").join("");
// "foofoofabc"
