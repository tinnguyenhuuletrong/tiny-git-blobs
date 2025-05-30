// If you see import errors, ensure your tsconfig paths or symlinks are set up for monorepo import resolution.
export type {
  ITree,
  ICommit,
  ITreeEntry,
} from "../../../../interface/src/objects";

// TODO: Replace with import from interface/src/objects when monorepo pathing is fixed.
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
