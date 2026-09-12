import { ListCollection } from "eridu-tech/collection";

new ListCollection([]).whenEmpty((c) => c.append([-3])).toArray();
// [-3]
