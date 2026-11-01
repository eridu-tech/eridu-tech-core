import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).afterOrFail((item) => item === 4);
// throws error
