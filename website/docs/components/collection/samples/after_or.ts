import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).afterOr(-1, (item) => item === 4);
// -1
