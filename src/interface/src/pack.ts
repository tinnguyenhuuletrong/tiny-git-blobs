import type { IBlob, ICommit, IMetadata, ITree } from "./objects";

export interface IPackObject {
  commits: ICommit[];
  trees: ITree[];
  blobs: IBlob[];
  metadata: IMetadata[];

  _header: {
    version: string;
    timestamp: string;
    others?: Record<string, string>;
  };
}

export interface IPackResult {
  data: Uint8Array;
}

export interface IPackAdapter {
  /**
   * Packs a collection of Git objects into a binary format
   * @param objects The objects to pack
   * @returns A binary representation of the objects
   */
  packObjects(objects: IPackObject): IPackResult;

  /**
   * Unpacks binary data into a collection of Git objects
   * @param data The binary data to unpack
   * @returns The unpacked objects
   */
  unpackObjects(data: Uint8Array): IPackObject;
}
