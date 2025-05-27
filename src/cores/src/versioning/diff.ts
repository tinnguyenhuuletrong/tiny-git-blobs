import type {
  IStorageAdapter,
  ICommit,
  ITree,
  IBlob,
  IMetadata,
  ITreeEntry,
} from "@gitblobsdb/interface";

export interface DiffResult {
  commitChains: string[]; // Sorted array of commit hashes from fromCommitHash to toCommitHash
  objects: {
    commits: Record<string, ICommit>;
    blobs: Record<string, IBlob>;
    trees: Record<string, ITree>;
    metadata: Record<string, IMetadata>;
  };
}

/**
 * Finds all objects that need to be transferred between two commits
 * @param fromCommitHash The starting commit hash
 * @param toCommitHash The target commit hash
 * @param storage The storage adapter to use for object retrieval
 * @param maxDepth Maximum depth to traverse (prevents stack overflow)
 * @returns A DiffResult containing all necessary objects and commit history
 */
export async function findRevisionDiff(
  fromCommitHash: string,
  toCommitHash: string,
  storage: IStorageAdapter,
  maxDepth: number = 1000
): Promise<DiffResult> {
  const result: DiffResult = {
    commitChains: [],
    objects: {
      commits: {},
      blobs: {},
      trees: {},
      metadata: {},
    },
  };

  // Make sure fromCommitHash exists
  const commit = await storage.getCommit(fromCommitHash);
  if (!commit) {
    throw new Error(`Commit not found: ${fromCommitHash}`);
  }

  // Set to track visited objects to avoid duplicates
  const visitedObjects = new Set<string>();
  const visitedCommits = new Set<string>();

  // Helper function to collect objects from a tree
  async function collectTreeObjects(treeHash: string): Promise<void> {
    if (visitedObjects.has(treeHash)) return;
    visitedObjects.add(treeHash);

    const tree = await storage.getTree(treeHash);
    if (!tree) {
      throw new Error(`Tree not found: ${treeHash}`);
    }

    result.objects.trees[treeHash] = tree;

    // Process all entries in the tree
    for (const entry of Object.values(tree.entries) as ITreeEntry[]) {
      // Collect blob
      if (!visitedObjects.has(entry.blob_hash)) {
        const blob = await storage.getBlob(entry.blob_hash);
        if (!blob) {
          throw new Error(`Blob not found: ${entry.blob_hash}`);
        }
        result.objects.blobs[entry.blob_hash] = blob;
        visitedObjects.add(entry.blob_hash);
      }

      // Collect metadata
      if (!visitedObjects.has(entry.metadata_hash)) {
        const metadata = await storage.getMetadata(entry.metadata_hash);
        if (!metadata) {
          throw new Error(`Metadata not found: ${entry.metadata_hash}`);
        }
        result.objects.metadata[entry.metadata_hash] = metadata;
        visitedObjects.add(entry.metadata_hash);
      }
    }
  }

  // Helper function to collect commits and their associated objects
  async function collectCommits(
    commitHash: string,
    depth: number
  ): Promise<boolean> {
    if (depth > maxDepth) {
      throw new Error(
        `Maximum depth ${maxDepth} exceeded while traversing commits`
      );
    }
    const commit = await storage.getCommit(commitHash);
    if (!commit) {
      throw new Error(`Commit not found: ${commitHash}`);
    }

    // If we've hit the fromCommitHash, we can stop collecting
    if (commitHash === fromCommitHash) {
      result.objects.commits[commitHash] = commit;
      result.commitChains.push(commitHash);
      // Collect tree objects
      await collectTreeObjects(commit.tree_hash);
      return true;
    }

    if (visitedCommits.has(commitHash)) return false;
    visitedCommits.add(commitHash);

    // Add commit to result
    result.commitChains.push(commitHash);
    result.objects.commits[commitHash] = commit;

    // Collect tree objects
    await collectTreeObjects(commit.tree_hash);

    // Recursively process parent commits
    for (const parentHash of commit.parent_hashes) {
      const found = await collectCommits(parentHash, depth + 1);
      if (found) return true;
    }

    return false;
  }

  // Start collecting from the target commit
  await collectCommits(toCommitHash, 0);

  // Sort commits to ensure they're in the correct order
  // This assumes commits are added in reverse chronological order
  result.commitChains.reverse();

  return result;
}
