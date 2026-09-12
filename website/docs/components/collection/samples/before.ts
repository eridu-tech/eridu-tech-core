import { ListCollection } from "eridu-tech/collection";

new ListCollection([1, 2, 3, 4]).before((item) => item === 2);
// 1
