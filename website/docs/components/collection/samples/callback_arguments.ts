import { ListCollection } from "eridu-tech/collection";

const collection = new ListCollection([2, 3, 2, 3, 4, 3]).filter(
    (item, index, collection) => {
        // Logs each item
        console.log("item:", item);

        // Logs each index of the item
        console.log("index:", index);

        // Logs the original collection
        console.log("collection:", collection.toArray());
        return item === 2;
    },
);

collection.toArray();
