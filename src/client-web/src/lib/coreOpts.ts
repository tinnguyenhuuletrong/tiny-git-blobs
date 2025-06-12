import type {
  IStorageAdapter,
  ITreeEntry,
  ITree,
  ICommit,
  IBlob,
  IMetadata,
  IPackObject,
  IPackResult,
} from "@gitblobsdb/interface";
import { createBlob, createCommit, createTree } from "@gitblobsdb/cores";
import { BsonPackAdapter } from "@gitblobsdb/adapter/src/pack/BsonPackAdapter";

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

  const currentEntries = head?.tree?.content.entries ?? {};
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

  const treeHash = commitObj.content.tree_hash;
  const treeObj = await storage.getTree(commitObj.content.tree_hash);
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

    for (const hash of commitObj.content.parent_hashes) {
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

  const currentEntries = { ...(head?.tree?.content.entries ?? {}) };
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

  const currentEntries = { ...(head?.tree?.content.entries ?? {}) };
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

export async function exportStorage(
  storage: IStorageAdapter
): Promise<IPackResult | null> {
  const storageExt = storage.asStorageExt?.();
  if (!storageExt) return null;

  const others: Record<string, string> = {};
  const packObject: IPackObject = {
    commits: [],
    trees: [],
    blobs: [],
    metadata: [],

    _header: {
      version: "1",
      timestamp: new Date().toString(),
      others,
    },
  };

  const currentHead = await fetchHead(storage);

  for await (const itm of storageExt.scanObject()) {
    switch (itm.type) {
      case "commit": {
        packObject.commits.push(itm as unknown as ICommit);
        break;
      }
      case "blob": {
        packObject.blobs.push(itm as unknown as IBlob);
        break;
      }
      case "metadata": {
        packObject.metadata.push(itm as unknown as IMetadata);
        break;
      }
      case "tree": {
        packObject.trees.push(itm as unknown as ITree);
        break;
      }
    }
  }

  others["commit_head"] = currentHead?.commit.hash || "";
  others["tree_head"] = currentHead?.tree.hash || "";

  const packer = new BsonPackAdapter();
  const res = packer.packObjects(packObject);
  return res;
}

export async function importStorage(
  storage: IStorageAdapter,
  bufData: ArrayBuffer
) {
  const storageExt = storage.asStorageExt?.();
  if (!storageExt) return null;

  const packer = new BsonPackAdapter();
  const packObj = packer.unpackObjects(new Uint8Array(bufData));

  await storageExt.replaceWithStorageSnapshot(packObj);

  return true;
}
