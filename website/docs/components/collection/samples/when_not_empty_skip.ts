import { ListCollection } from "eridu-tech/collection";

new ListCollection([]).whenNotEmpty((c) => c.append([-3])).toArray();
// []
