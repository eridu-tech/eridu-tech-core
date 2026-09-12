import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).lastOrFail((item) => item === 5);
// throws error
