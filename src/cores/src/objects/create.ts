import type { IBlob, ICommit, IMetadata, ITree } from "@gitblobsdb/interface";
import { hashBlob, hashCommit, hashMetadata, hashTree } from "../utils/hash";

/**
 * Create a new blob object
 */
export function createBlob(content: Uint8Array): IBlob {
  const hash = hashBlob(content);
  return {
    type: "blob",
    hash,
    content: {
      data: content,
    },
  };
}

/**
 * Create a new metadata object
 */
export function createMetadata(data: Record<string, any>): IMetadata {
  const hash = hashMetadata(data);
  return {
    type: "metadata",
    hash,
    content: {
      data,
    },
  };
}

/**
 * Create a new tree object
 */
export function createTree(
  entries: Record<
    string,
    { blob_hash: string; metadata_hash: string; type: "file" }
  >
): ITree {
  const hash = hashTree(entries);
  return {
    type: "tree",
    hash,
    content: {
      entries,
    },
  };
}

/**
 * Create a new commit object
 */
export function createCommit(content: {
  tree_hash: string;
  parent_hashes: string[];
  author: { name: string; email: string; timestamp: string };
  committer: { name: string; email: string; timestamp: string };
  message: string;
}): ICommit {
  const hash = hashCommit(content);
  return {
    type: "commit",
    hash,
    content,
  };
}
