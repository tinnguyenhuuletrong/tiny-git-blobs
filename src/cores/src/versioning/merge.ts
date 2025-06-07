import type { ITree, ITreeEntry, IStorageAdapter } from "@gitblobsdb/interface";
import type { DiffResult } from "./diff";
import { createCommit, createTree } from "../objects/create";

/**
 * Represents the result of a merge operation
 */
export interface MergeResult {
  isSuccess: boolean;
  conflicts: ITreeConflict[];
}

/**
 * Represents a merge conflict in a tree
 */
export interface ITreeConflict {
  path: string;
  base: ITreeEntry | null;
  ours: ITreeEntry | null;
  theirs: ITreeEntry | null;
}

/**
 * Merge changes from a diff into the current state and apply them to storage
 * @param storage The storage adapter to use for object retrieval and storage
 * @param diff The diff result containing changes to merge
 * @returns MergeResult containing success status and any conflicts
 */
export async function merge(
  storage: IStorageAdapter,
  diff: DiffResult
): Promise<MergeResult> {
  // Get the current head commit
  const head = await storage.getHead();
  if (!head) {
    throw new Error("No HEAD found in storage");
  }

  // Get the current tree
  const currentCommit = await storage.getCommit(head.value);
  if (!currentCommit) {
    throw new Error("Current commit not found");
  }

  const currentTree = await storage.getTree(currentCommit.content.tree_hash);
  if (!currentTree) {
    throw new Error("Current tree not found");
  }

  // Get the target tree from the diff
  const targetCommit =
    diff.objects.commits[diff.commitChains[diff.commitChains.length - 1]];
  if (!targetCommit) {
    throw new Error("Target commit not found in diff");
  }

  const targetTree = diff.objects.trees[targetCommit.content.tree_hash];
  if (!targetTree) {
    throw new Error("Target tree not found in diff");
  }

  // Get the base tree (common ancestor)
  const baseCommit = diff.objects.commits[diff.commitChains[0]];
  if (!baseCommit) {
    throw new Error("Base commit not found in diff");
  }

  const baseTree = diff.objects.trees[baseCommit.content.tree_hash];
  if (!baseTree) {
    throw new Error("Base tree not found in diff");
  }

  // Merge the trees
  const { merged: mergedTree, conflicts } = mergeTrees(
    baseTree,
    currentTree,
    targetTree
  );

  // If there are conflicts, return false
  if (conflicts.length > 0) {
    return {
      isSuccess: false,
      conflicts,
    };
  }

  // Store all objects from the diff
  for (const commit of Object.values(diff.objects.commits)) {
    await storage.putCommit(commit);
  }

  for (const tree of Object.values(diff.objects.trees)) {
    await storage.putTree(tree);
  }

  for (const blob of Object.values(diff.objects.blobs)) {
    await storage.putBlob(blob);
  }

  for (const metadata of Object.values(diff.objects.metadata)) {
    await storage.putMetadata(metadata);
  }

  // Store the merged tree
  await storage.putTree(mergedTree);

  // Create and store a new merge commit
  const mergeCommit = createCommit({
    tree_hash: mergedTree.hash,
    parent_hashes: [targetCommit.hash],
    author: targetCommit.content.author,
    committer: targetCommit.content.committer,
    message: `Merge ${targetCommit.hash} into ${currentCommit.hash}`,
  });

  await storage.putCommit(mergeCommit);

  // Update HEAD to point to the new merge commit
  await storage.setHead({
    type: "commit",
    value: mergeCommit.hash,
  });

  return {
    isSuccess: true,
    conflicts: [],
  };
}

/**
 * Merge two trees with a common base
 * Returns the merged tree and any conflicts
 */
export function mergeTrees(
  base: ITree,
  ours: ITree,
  theirs: ITree
): {
  merged: ITree;
  conflicts: ITreeConflict[];
} {
  const conflicts: ITreeConflict[] = [];
  const mergedEntries: Record<string, ITreeEntry> = {};

  // Get all unique paths from all trees
  const allPaths = new Set([
    ...Object.keys(base.content.entries),
    ...Object.keys(ours.content.entries),
    ...Object.keys(theirs.content.entries),
  ]);

  // Process each path
  for (const path of allPaths) {
    const baseEntry = base.content.entries[path] || null;
    const ourEntry = ours.content.entries[path] || null;
    const theirEntry = theirs.content.entries[path] || null;

    // Check for conflicts
    if (hasConflict(baseEntry, ourEntry, theirEntry)) {
      conflicts.push({
        path,
        base: baseEntry,
        ours: ourEntry,
        theirs: theirEntry,
      });
      continue;
    }

    // No conflict, use our version if it exists, otherwise use their version
    mergedEntries[path] = ourEntry || theirEntry || baseEntry!;
  }

  return {
    merged: createTree(mergedEntries),
    conflicts,
  };
}

/**
 * Check if there is a conflict between three tree entries
 */
function hasConflict(
  base: ITreeEntry | null,
  ours: ITreeEntry | null,
  theirs: ITreeEntry | null
): boolean {
  // If all entries are the same, no conflict
  if (areEntriesEqual(base, ours) && areEntriesEqual(base, theirs)) {
    return false;
  }

  // If both sides made the same change, no conflict
  if (areEntriesEqual(ours, theirs)) {
    return false;
  }

  // If file was added on one side but not the other, no conflict
  if (!base && (ours || theirs)) {
    return false;
  }

  // If one side deleted the file and the other modified it, conflict
  if (base && ((!ours && theirs) || (ours && !theirs))) {
    return true;
  }

  // If both sides modified the file differently, conflict
  if (ours && theirs && !areEntriesEqual(ours, theirs)) {
    return true;
  }

  return false;
}

/**
 * Check if two tree entries are equal
 */
function areEntriesEqual(a: ITreeEntry | null, b: ITreeEntry | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.blob_hash === b.blob_hash && a.metadata_hash === b.metadata_hash;
}

/**
 * Check if a tree merge has conflicts
 */
export function hasMergeConflicts(conflicts: ITreeConflict[]): boolean {
  return conflicts.length > 0;
}

/**
 * Get a list of paths that have conflicts
 */
export function getConflictedPaths(conflicts: ITreeConflict[]): string[] {
  return conflicts.map((conflict) => conflict.path);
}
