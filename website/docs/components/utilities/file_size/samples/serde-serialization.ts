import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { FileSize } from "eridu-tech/file-size";

const serde = new SuperJsonSerde();

serde.registerCustom(FileSize.serdeTransformer);

const fileSize = FileSize.fromBytes(12);
const serializedFileSize = await serde.serialize(fileSize);
const deserializedFileSize = await serde.deserialize(serializedFileSize);

// logs false
console.log(serializedFileSize === deserializedFileSize);
