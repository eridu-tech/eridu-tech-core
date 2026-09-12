import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).beforeOrFail((item) => item === 1);
// throws error
