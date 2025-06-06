/**
 * Core object interfaces for GitBlobsDB
 */

export type ObjectType = "blob" | "tree" | "commit" | "metadata";

// Base interface for all objects
export interface IObject {
  type: ObjectType;
  hash: string;
  content: IBlobContent | IMetadataContent | ICommitContent | ITreeContent;
}

// Base interface for content types
export interface IBlobContent {
  data: Uint8Array;
}

export interface IMetadataContent {
  data: Record<string, any>;
}

export interface ITreeContent {
  entries: Record<string, ITreeEntry>;
}

export interface ICommitContent {
  tree_hash: string;
  parent_hashes: string[];
  author: IAuthor;
  committer: IAuthor;
  message: string;
}

// Specific object interfaces
export interface IBlob extends IObject {
  type: "blob";
  content: IBlobContent;
}

export interface IMetadata extends IObject {
  type: "metadata";
  content: IMetadataContent;
}

export interface ITree extends IObject {
  type: "tree";
  content: ITreeContent;
}

export interface ICommit extends IObject {
  type: "commit";
  content: ICommitContent;
}

export interface ITreeEntry {
  blob_hash: string;
  metadata_hash: string;
  type: "file";
}

export interface IAuthor {
  name: string;
  email: string;
  timestamp: string; // ISO 8601
}

export interface IRef {
  name: string;
  commit_hash: string;
}

export interface IHead {
  type: "ref" | "commit";
  value: string;
}

export const AllObjectTypes: ObjectType[] = [
  "blob",
  "tree",
  "commit",
  "metadata",
] as const;

export interface ITreeSnapshot {
  commitHash: string;
  treeData: Record<
    string,
    ITreeEntry & {
      metadata: IMetadataContent["data"];
      blob: IBlobContent["data"];
    }
  >;
}
