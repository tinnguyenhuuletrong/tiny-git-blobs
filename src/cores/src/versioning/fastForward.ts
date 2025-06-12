import type { IStorageAdapter } from "@gitblobsdb/interface";
import type { DiffResult } from "./diff";

/**
 * Represents the result of a merge operation
 */
export interface FastForwardResult {
  isSuccess: boolean;
}

/**
 * Fast-forward changes from a diff into the current state and apply them to storage
 * @param storage The storage adapter to use for object retrieval and storage
 * @param diff The diff result containing changes to fast-forward
 * @returns MergeResult containing success status and any conflicts
 */
export async function fastForward(
  storage: IStorageAdapter,
  diff: DiffResult
): Promise<FastForwardResult> {
  // Get the current head commit
  const head = await storage.getHead();
  if (!head) {
    throw new Error("No HEAD found in storage");
  }

  // Ensure head matches the first commit in commitChains
  const firstCommitHash = diff.commitChains[0];
  if (head.value !== firstCommitHash) {
    throw new Error("HEAD does not match the first commit in commitChains");
  }

  // Apply commits one by one
  for (const commitHash of diff.commitChains) {
    const commit = diff.objects.commits[commitHash];
    if (!commit) {
      throw new Error(`Commit ${commitHash} not found in diff`);
    }

    // Store the commit
    await storage.putCommit(commit);

    // Store the associated tree
    const tree = diff.objects.trees[commit.content.tree_hash];
    if (!tree) {
      throw new Error(`Tree ${commit.content.tree_hash} not found in diff`);
    }
    await storage.putTree(tree);

    // Store associated blobs
    for (const blobHash of Object.keys(tree.content.entries)) {
      const blob = diff.objects.blobs[blobHash];
      if (blob) {
        await storage.putBlob(blob);
      }
    }
  }

  // Update HEAD to point to the last commit in commitChains
  const lastCommitHash = diff.commitChains[diff.commitChains.length - 1];
  await storage.setHead({
    type: "commit",
    value: lastCommitHash,
  });

  return {
    isSuccess: true,
  };
}
