import type {
  IStorageAdapter,
  ITreeEntry,
  ITree,
  ICommit,
} from "@gitblobsdb/interface";
import { createBlob, createCommit, createTree } from "@gitblobsdb/cores";

export async function addFile(
  storage: IStorageAdapter,
  fileName: string,
  fileData: string
) {
  const encoder = new TextEncoder();
  const head = await fetchHead(storage);
  const newFileBlob = createBlob(encoder.encode(fileData));

  const parent_hashes = head?.commit.hash ? [head?.commit.hash] : [];

  const newTreeEntry: ITreeEntry = {
    blob_hash: newFileBlob.hash,
    metadata_hash: "",
    type: "file",
  };

  const currentEntries = head?.tree?.entries ?? {};
  const newTree = Object.fromEntries([
    ...Object.entries(currentEntries),
    [fileName, newTreeEntry],
  ]);
  const newTreeObj = createTree(newTree);

  const timestamp = new Date().toISOString();
  const newCommit = createCommit({
    tree_hash: newTreeObj.hash,
    parent_hashes,
    author: {
      name: "",
      email: "",
      timestamp,
    },
    committer: {
      name: "",
      email: "",
      timestamp,
    },
    message: `add file: ${fileName}`,
  });

  // flush
  await Promise.all([
    await storage.putBlob(newFileBlob),
    await storage.putTree(newTreeObj),
    await storage.putCommit(newCommit),
  ]);

  await storage.setHead({
    type: "commit",
    value: newCommit.hash,
  });
  return newCommit;
}

export async function fetchCommitHashAtHead(
  storage: IStorageAdapter
): Promise<string | null> {
  const head = await storage.getHead();
  if (!head) return null;
  if (head.type === "ref")
    throw new Error("Currently not support Head point to ref");

  const commitHash = head.value;
  return commitHash;
}

export async function fetchHead(storage: IStorageAdapter): Promise<{
  tree: ITree;
  commit: ICommit;
} | null> {
  const head = await storage.getHead();
  if (!head) return null;
  if (head.type === "ref")
    throw new Error("Currently not support Head point to ref");

  const commitHash = head.value;
  const commitObj = await storage.getCommit(commitHash);
  if (!commitObj) throw new Error(`Commit at head not found: ${commitHash}`);

  const treeHash = commitObj.tree_hash;
  const treeObj = await storage.getTree(commitObj.tree_hash);
  if (!treeObj) throw new Error(`Tree at head not found: ${treeHash}`);

  return {
    tree: treeObj,
    commit: commitObj,
  };
}

export async function listTopCommit(storage: IStorageAdapter, depth: number) {
  const head = await fetchHead(storage);
  if (!head) return;

  const results: ICommit[] = [];
  const onVisitFn = (itm: ICommit) => {
    results.push(itm);
  };

  await dfsFromCommit(storage, head?.commit.hash, onVisitFn, depth);

  return results;
}

async function dfsFromCommit(
  storage: IStorageAdapter,
  fromCommitHash: string,
  onVisitFn: (_: ICommit) => void,
  maxDepths: number = 10
) {
  const queue = [];
  const visited = new Set<string>();
  let depth: number = 0;

  queue.push(fromCommitHash);

  while (queue.length > 0) {
    depth++;
    if (depth >= maxDepths) break;

    const topCommitHash = queue.shift();
    if (!topCommitHash) break;

    if (visited.has(topCommitHash)) continue;

    visited.add(topCommitHash);

    const commitObj = await storage.getCommit(topCommitHash);
    if (!commitObj) break;

    onVisitFn(commitObj);

    for (const hash of commitObj.parent_hashes) {
      queue.push(hash);
    }
  }
}

export async function updateFile(
  storage: IStorageAdapter,
  fileName: string,
  fileData: string
) {
  const encoder = new TextEncoder();
  const head = await fetchHead(storage);
  if (!head) throw new Error("No HEAD found");

  const newFileBlob = createBlob(encoder.encode(fileData));
  const parent_hashes = head?.commit.hash ? [head?.commit.hash] : [];

  const currentEntries = { ...(head?.tree?.entries ?? {}) };
  if (!currentEntries[fileName]) throw new Error("File does not exist");
  currentEntries[fileName] = {
    blob_hash: newFileBlob.hash,
    metadata_hash: "",
    type: "file",
  };
  const newTreeObj = createTree(currentEntries);

  const timestamp = new Date().toISOString();
  const newCommit = createCommit({
    tree_hash: newTreeObj.hash,
    parent_hashes,
    author: {
      name: "",
      email: "",
      timestamp,
    },
    committer: {
      name: "",
      email: "",
      timestamp,
    },
    message: `update file: ${fileName}`,
  });

  await Promise.all([
    await storage.putBlob(newFileBlob),
    await storage.putTree(newTreeObj),
    await storage.putCommit(newCommit),
  ]);

  await storage.setHead({
    type: "commit",
    value: newCommit.hash,
  });
  return newCommit;
}

export async function deleteFile(storage: IStorageAdapter, fileName: string) {
  const head = await fetchHead(storage);
  if (!head) throw new Error("No HEAD found");
  const parent_hashes = head?.commit.hash ? [head?.commit.hash] : [];

  const currentEntries = { ...(head?.tree?.entries ?? {}) };
  if (!currentEntries[fileName]) throw new Error("File does not exist");
  delete currentEntries[fileName];
  const newTreeObj = createTree(currentEntries);

  const timestamp = new Date().toISOString();
  const newCommit = createCommit({
    tree_hash: newTreeObj.hash,
    parent_hashes,
    author: {
      name: "",
      email: "",
      timestamp,
    },
    committer: {
      name: "",
      email: "",
      timestamp,
    },
    message: `delete file: ${fileName}`,
  });

  await Promise.all([
    await storage.putTree(newTreeObj),
    await storage.putCommit(newCommit),
  ]);

  await storage.setHead({
    type: "commit",
    value: newCommit.hash,
  });
  return newCommit;
}
