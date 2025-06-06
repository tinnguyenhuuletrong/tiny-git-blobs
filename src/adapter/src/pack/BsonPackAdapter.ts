import { BSON } from "bson";
import type {
  IPackObject,
  IPackResult,
  IPackAdapter,
  IBlob,
} from "@gitblobsdb/interface";

export class BsonPackAdapter implements IPackAdapter {
  packObjects(objects: IPackObject): IPackResult {
    // Convert the objects to a BSON document
    const bsonData = BSON.serialize(objects);

    // Return the binary data
    return {
      data: new Uint8Array(bsonData),
      _header: objects._header,
    };
  }

  unpackObjects(data: Uint8Array): IPackObject {
    // Deserialize the BSON data
    const objects = BSON.deserialize(data) as IPackObject;

    // Convert BSON Binary back to Uint8Array for blobs
    const blobs = objects.blobs.map((blob: IBlob) => {
      return {
        type: "blob" as const,
        hash: blob.hash,
        content: {
          data: new Uint8Array(blob.content.data.buffer),
        },
      };
    });

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
