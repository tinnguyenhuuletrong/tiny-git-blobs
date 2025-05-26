import type { ITree, ITreeEntry } from "../../../interface/src";

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
    ...Object.keys(base.entries),
    ...Object.keys(ours.entries),
    ...Object.keys(theirs.entries),
  ]);

  // Process each path
  for (const path of allPaths) {
    const baseEntry = base.entries[path] || null;
    const ourEntry = ours.entries[path] || null;
    const theirEntry = theirs.entries[path] || null;

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
    merged: { hash: "", entries: mergedEntries }, // Hash will be computed by caller
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
