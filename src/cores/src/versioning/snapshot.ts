import { IStorageAdapter, ITreeSnapshot } from "@gitblobsdb/interface";

/**
 * Creates a tree snapshot for a given commit hash
 * @param commitHash - The commit hash to create a snapshot for
 * @param storage - The storage adapter to use for retrieving objects
 * @returns A promise that resolves to a TreeSnapshot containing all tree data
 * @throws Error if commit, tree, blob, or metadata objects are not found
 */
export async function createTreeSnapshot(
  commitHash: string,
  storage: IStorageAdapter
): Promise<ITreeSnapshot> {
  // Get the commit object
  const commit = await storage.getCommit(commitHash);
  if (!commit) {
    throw new Error(`Commit not found: ${commitHash}`);
  }

  // Get the tree object
  const tree = await storage.getTree(commit.tree_hash);
  if (!tree) {
    throw new Error(`Tree not found: ${commit.tree_hash}`);
  }

  // Initialize the tree data object
  const treeData: ITreeSnapshot["treeData"] = {};

  // Process each entry in the tree
  for (const [path, entry] of Object.entries(tree.entries)) {
    // Get the blob and metadata objects
    const [blob, metadata] = await Promise.all([
      storage.getBlob(entry.blob_hash),
      storage.getMetadata(entry.metadata_hash),
    ]);

    if (!blob) {
      throw new Error(`Blob not found: ${entry.blob_hash}`);
    }

    // Add the entry to the tree data
    treeData[path] = {
      ...entry,
      metadata: metadata?.data ?? {},
      blob: blob.content,
    };
  }

  return {
    commitHash,
    treeData,
  };
}
