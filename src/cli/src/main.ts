import { parseArgs } from "util";
import { join, resolve } from "path";
import { FileSystemStorageAdapter } from "@gitblobsdb/adapter";
import {
  createTree,
  createBlob,
  createCommit,
  createMetadata,
} from "@gitblobsdb/cores";
import { cwd } from "process";
import {
  ICommit,
  IStorageAdapter,
  ITree,
  ITreeEntry,
} from "@gitblobsdb/interface";

function parseOptions() {
  const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      storagePath: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: true,
  });
  return {
    storagePath: values["storagePath"] || join(cwd(), "./_tmp/.storage"),
  };
}

async function main() {
  const appOptions = parseOptions();
  const storage = new FileSystemStorageAdapter(appOptions.storagePath);

  console.log("CLI app");
  console.log("\t-storagePath:", resolve(appOptions.storagePath));

  for await (const line of console) {
    const [cmd, ...args] = line.split(" ");
    switch (cmd) {
      case "head": {
        const head = await fetchHead(storage);
        console.dir(head, { depth: 10 });
        break;
      }
      case "add": {
        const fileName = args[0];
        const fileContent = args.slice(1).join(" ");
        if (!(fileName && fileContent)) {
          console.warn("usage: add <fileName> <fileContent>");
          break;
        }
        const commit = await addFile(storage, fileName, fileContent);

        console.log("done. head commit: ", commit.hash);

        break;
      }
      default:
        console.log("unknown command", cmd);
        break;
    }
  }
}

async function addFile(
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

async function fetchHead(storage: IStorageAdapter): Promise<{
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

main();
