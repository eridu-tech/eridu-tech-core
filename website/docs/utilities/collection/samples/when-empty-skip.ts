import { ListCollection } from "eridu-tech/collection";

new ListCollection([1]).whenEmpty((c) => c.append([-3])).toArray();
// [1]
