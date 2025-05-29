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

function printHelp() {
  console.log("\x1b[37mAvailable commands:\x1b[0m");
  console.log(
    "\x1b[37m\thead: Fetch and display the current head commit.\x1b[0m"
  );
  console.log(
    "\x1b[37m\tadd <fileName> <fileContent>: Add a new file with the specified content.\x1b[0m"
  );
  console.log(
    "\x1b[37m\tgetBlob <blobHash>: Retrieve and display the content of a blob by its hash.\x1b[0m"
  );
  console.log("\x1b[37m\thistory: Display the commit history.\x1b[0m");
  console.log("\x1b[37m\thelp: Display this help message.\x1b[0m");
}

function printCommitHistory(newToOldCommits: ICommit[]) {
  newToOldCommits.forEach((commit) => {
    console.log(`commit \x1b[33m${commit.hash}\x1b[0m`);
    console.log(`Author: ${commit.author.name} <${commit.author.email}>`);
    console.log(`Date: ${new Date(commit.author.timestamp).toLocaleString()}`);
    console.log(`\n    ${commit.message}\n`);
  });
}

async function main() {
  const appOptions = parseOptions();
  const storage = new FileSystemStorageAdapter(appOptions.storagePath);

  console.log("CLI app");
  console.log(
    "\x1b[34m\t-storagePath:\x1b[0m",
    resolve(appOptions.storagePath)
  );
  printHelp();

  // change stdin color
  process.stdout.write("\x1b[34m> ");
  for await (const line of console) {
    // reset color for stdout
    process.stdout.write("\n\x1b[0m");

    const [cmd, ...args] = line.split(" ");
    switch (cmd) {
      case "help": {
        printHelp();
        break;
      }
      case "head": {
        const head = await fetchHead(storage);
        console.dir(head, { depth: 10 });
        break;
      }
      case "add": {
        const fileName = args[0];
        const fileContent = args.slice(1).join(" ");
        if (!(fileName && fileContent)) {
          console.warn("\x1b[37musage: add <fileName> <fileContent>\x1b[0m");
          break;
        }
        const commit = await addFile(storage, fileName, fileContent);
        console.log(`done. head commit: \x1b[33m${commit.hash}\x1b[0m`);
        break;
      }
      case "getBlob": {
        const blobHash = args[0];
        const hasObject = await storage.hasObject(blobHash);
        if (!hasObject) {
          console.error(`Blob with hash ${blobHash} not found`);
          break;
        }
        const blobObj = await storage.getBlob(blobHash);
        if (!blobObj) {
          console.error(`Blob with hash ${blobHash} not found`);
          break;
        }
        const decoder = new TextDecoder();
        console.log(decoder.decode(blobObj.content));
        break;
      }
      case "history": {
        const newToOldCommits = (await listTopCommit(storage, 100)) ?? [];
        printCommitHistory(newToOldCommits);
        break;
      }
      default:
        console.warn("unknown command", cmd);
        printHelp();
        break;
    }

    // change stdin color
    process.stdout.write("\x1b[34m> ");
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

async function listTopCommit(storage: IStorageAdapter, depth: number) {
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

main();
