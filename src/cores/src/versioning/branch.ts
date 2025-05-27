import type { IHead, IRef } from "@gitblobsdb/interface";

/**
 * Create a new branch reference
 */
export function createBranch(name: string, commitHash: string): IRef {
  return {
    name: name.startsWith("refs/heads/") ? name : `refs/heads/${name}`,
    commit_hash: commitHash,
  };
}

/**
 * Create a new tag reference
 */
export function createTag(name: string, commitHash: string): IRef {
  return {
    name: name.startsWith("refs/tags/") ? name : `refs/tags/${name}`,
    commit_hash: commitHash,
  };
}

/**
 * Update a branch reference to point to a new commit
 */
export function updateBranch(branch: IRef, newCommitHash: string): IRef {
  return {
    ...branch,
    commit_hash: newCommitHash,
  };
}

/**
 * Create a HEAD reference pointing to a branch
 */
export function createHeadFromBranch(branchName: string): IHead {
  return {
    type: "ref",
    value: branchName.startsWith("refs/heads/")
      ? branchName
      : `refs/heads/${branchName}`,
  };
}

/**
 * Create a HEAD reference pointing to a commit (detached HEAD state)
 */
export function createHeadFromCommit(commitHash: string): IHead {
  return {
    type: "commit",
    value: commitHash,
  };
}

/**
 * Check if a HEAD reference is in detached state
 */
export function isDetachedHead(head: IHead): boolean {
  return head.type === "commit";
}

/**
 * Get the branch name from a HEAD reference
 * Returns null if HEAD is detached
 */
export function getBranchFromHead(head: IHead): string | null {
  if (head.type === "ref") {
    return head.value;
  }
  return null;
}

/**
 * Get the commit hash from a HEAD reference
 */
export function getCommitFromHead(head: IHead): string {
  if (head.type === "commit") {
    return head.value;
  }
  throw new Error("HEAD is not in detached state");
}
