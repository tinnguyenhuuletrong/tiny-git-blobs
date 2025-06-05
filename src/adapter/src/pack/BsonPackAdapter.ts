import { BSON } from "bson";
import type {
  IPackObject,
  IPackResult,
  IPackAdapter,
} from "@gitblobsdb/interface";

export class BsonPackAdapter implements IPackAdapter {
  packObjects(objects: IPackObject): IPackResult {
    // Convert the objects to a BSON document
    const bsonData = BSON.serialize(objects);

    // Return the binary data
    return {
      data: new Uint8Array(bsonData),
    };
  }

  unpackObjects(data: Uint8Array): IPackObject {
    // Deserialize the BSON data
    const objects = BSON.deserialize(data) as IPackObject;

    // Convert BSON Binary back to Uint8Array for blobs
    const blobs = objects.blobs.map((blob) => ({
      ...blob,
      content: new Uint8Array(blob.content.buffer),
    }));

    // Return the unpacked objects
    return {
      commits: objects.commits,
      trees: objects.trees,
      blobs,
      metadata: objects.metadata,
      _header: objects._header,
    };
  }
}
