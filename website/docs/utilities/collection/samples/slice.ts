import { ListCollection } from "eridu-tech/collection";

new ListCollection(["a", "b", "c", "d", "e", "f"]).slice(3).toArray();
// ["d", "e", "f"]
