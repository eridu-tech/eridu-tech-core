import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4, 5]).sole((item) => item === 4);
// 4
