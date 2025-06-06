import type { ICommit } from "@gitblobsdb/interface";
import { createCommit } from "../objects/create";

/**
 * Check if a commit is a fast-forward update
 * A fast-forward update means the new commit is a direct descendant of the current commit
 */
export function isFastForward(
  currentCommit: ICommit,
  newCommit: ICommit
): boolean {
  // If the new commit is already an ancestor of the current commit, it's not a fast-forward
  if (currentCommit.hash === newCommit.hash) {
    return true;
  }

  // Check if the current commit is in the parent history of the new commit
  const parentHashes = new Set(newCommit.content.parent_hashes);
  return parentHashes.has(currentCommit.hash);
}

/**
 * Find the common ancestor of two commits
 * Returns null if there is no common ancestor
 */
export function findCommonAncestor(
  commit1: ICommit,
  commit2: ICommit
): ICommit | null {
  if (commit1.hash === commit2.hash) {
    return commit1;
  }

  // Simple implementation: check if one commit is a direct ancestor of the other
  if (commit1.content.parent_hashes.includes(commit2.hash)) {
    return commit2;
  }
  if (commit2.content.parent_hashes.includes(commit1.hash)) {
    return commit1;
  }

  // TODO: Implement more sophisticated ancestor finding for complex commit histories
  // This would involve traversing the commit graph to find the nearest common ancestor
  return null;
}

/**
 * Create a merge commit
 */
export function createMergeCommit(params: {
  tree_hash: string;
  parent_hashes: string[];
  author: { name: string; email: string; timestamp: string };
  committer: { name: string; email: string; timestamp: string };
  message: string;
}): ICommit {
  return createCommit(params);
}

/**
 * Check if a commit is a merge commit
 */
export function isMergeCommit(commit: ICommit): boolean {
  return commit.content.parent_hashes.length > 1;
}
