/**
 * Core object interfaces for GitBlobsDB
 */

export interface IBlob {
  hash: string;
  content: Uint8Array;
}

export interface IMetadata {
  hash: string;
  data: Record<string, any>;
}

export interface ITreeEntry {
  blob_hash: string;
  metadata_hash: string;
  type: "file";
}

export interface ITree {
  hash: string;
  entries: Record<string, ITreeEntry>;
}

export interface IAuthor {
  name: string;
  email: string;
  timestamp: string; // ISO 8601
}

export interface ICommit {
  hash: string;
  tree_hash: string;
  parent_hashes: string[];
  author: IAuthor;
  committer: IAuthor;
  message: string;
}

export interface IRef {
  name: string;
  commit_hash: string;
}

export interface IHead {
  type: "ref" | "commit";
  value: string;
}

export type ObjectType = "blob" | "tree" | "commit" | "metadata";
export const AllObjectTypes: ObjectType[] = [
  "blob",
  "tree",
  "commit",
  "metadata",
] as const;

export interface IObject {
  type: ObjectType;
  hash: string;
  content: Uint8Array | Record<string, any>;
}

export interface ITreeSnapshot {
  commitHash: string;
  treeData: Record<
    string,
    ITreeEntry & {
      metadata: IMetadata["data"];
      blob: IBlob["content"];
    }
  >;
}
