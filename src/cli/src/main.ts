import { parseArgs } from "util";
import { join, resolve } from "path";
import { FileSystemStorageAdapter } from "@gitblobsdb/adapter";
import {
  createTree,
  createBlob,
  createCommit,
  SnapshotHelper,
} from "@gitblobsdb/cores";
import { cwd } from "process";
import {
  ICommit,
  IStorageAdapter,
  IStorageAdapterEx,
  ITree,
  ITreeEntry,
  ITreeSnapshot,
} from "@gitblobsdb/interface";
import {
  DiffResult,
  findRevisionDiff,
} from "@gitblobsdb/cores/src/versioning/diff";
import { BsonPackAdapter } from "@gitblobsdb/adapter/src/pack/BsonPackAdapter";
import { writeFile } from "fs/promises";

// Define color function
const ASCII_COLORS = {
  reset: "\x1b[0m",
  gray: "\x1b[37m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
} as const;
function color(colorName: keyof typeof ASCII_COLORS, content: string): string {
  return `${ASCII_COLORS[colorName] || ASCII_COLORS.reset}${content}${
    ASCII_COLORS.reset
  }`;
}

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
  console.log(color("gray", "Available commands:"));
  console.log(
    color("gray", "\thead: Fetch and display the current head commit.")
  );
  console.log(
    color(
      "gray",
      "\tadd <fileName> <fileContent>: Add a new file with the specified content."
    )
  );
  console.log(
    color(
      "gray",
      "\tgetBlob <blobHash>: Retrieve and display the content of a blob by its hash."
    )
  );
  console.log(color("gray", "\thistory: Display the commit history."));
  console.log(color("gray", "\thelp: Display this help message."));
  console.log(
    color(
      "gray",
      "\tsnapshot [commitHash]: Retrieve a snapshot of the repository state at a specific commit (defaults to head if not provided)."
    )
  );
  console.log(
    color(
      "gray",
      "\tdiff [--save] <fromCommitHash> [toCommitHash]: Generate diff package update data from fromCommitHash to toCommitHash. (default fromCommitHash is head)"
    )
  );
}

function printCommitHistory(newToOldCommits: ICommit[]) {
  newToOldCommits.forEach((commit) => {
    console.log(`commit ${color("yellow", commit.hash)}`);
    console.log(`Author: ${commit.author.name} <${commit.author.email}>`);
    console.log(`Date: ${new Date(commit.author.timestamp).toLocaleString()}`);
    console.log(`\n    ${commit.message}\n`);
  });
}

function printSnapshot(snapshot: ITreeSnapshot) {
  console.log(`commitHash: ${color("yellow", snapshot.commitHash)}`); // Yellow color for commitHash

  const textDecoder = new TextDecoder();

  for (const [fileName, entry] of Object.entries(snapshot.treeData)) {
    console.log(
      `- ${color("green", fileName)} - ${color("gray", entry.blob_hash)}`
    ); // Green color for fileName, Gray for blobHash
    console.log(
      `   - ${color("cyan", "metadata")}: ${JSON.stringify(entry.metadata)}`
    );

    // Limit file content to 100 characters
    const rawContent = textDecoder.decode(entry.blob);
    const content =
      rawContent.length > 100
        ? rawContent.substring(0, 100) + "..."
        : rawContent;
    console.log(`   - ${color("cyan", "textBlob")}: ${content}`);
  }
}

async function main() {
  const appOptions = parseOptions();
  const storage = new FileSystemStorageAdapter(appOptions.storagePath);

  console.log("CLI app");
  console.log(
    color("blue", "\t-storagePath:"),
    resolve(appOptions.storagePath)
  );
  printHelp();

  // change stdin color
  process.stdout.write(color("blue", "> "));
  for await (const line of console) {
    // reset color for stdout
    process.stdout.write("\n" + color("reset", ""));

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
          console.warn(color("gray", "usage: add <fileName> <fileContent>"));
          break;
        }
        const commit = await addFile(storage, fileName, fileContent);
        console.log(`done. head commit: ${color("yellow", commit.hash)}`);
        break;
      }
      case "getBlob": {
        const blobHash = args[0];
        const hasObject = await storage.hasObject(blobHash);
        if (!hasObject) {
          console.error(color("gray", `Blob with hash ${blobHash} not found`));
          break;
        }
        const blobObj = await storage.getBlob(blobHash);
        if (!blobObj) {
          console.error(color("gray", `Blob with hash ${blobHash} not found`));
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
      case "snapshot": {
        let commitHash = args[0];
        if (!commitHash) {
          commitHash = (await fetchCommitHashAtHead(storage)) ?? "";
        }
        if (!commitHash) {
          console.error(
            color(
              "gray",
              `Could not resolve commitHash: ${color("yellow", commitHash)}`
            )
          );
          break;
        }
        try {
          const snapshot = await SnapshotHelper.createTreeSnapshot(
            commitHash,
            storage
          );

          printSnapshot(snapshot);
        } catch (err: any) {
          console.warn(color("gray", err.message));
        }

        break;
      }
      case "diff": {
        const flags = args.filter((itm) => itm.startsWith("-"));
        const params = args.filter((itm) => !itm.startsWith("-"));
        let fromCommitHash: string = params[0];
        let toCommitHash: string = params[1] || "head";

        if (toCommitHash === "head") {
          const info = await fetchHead(storage);
          if (!info) {
            console.error(color("gray", `Could not resolve head`));
            break;
          }
          toCommitHash = info.commit.hash;
        }

        if (!(await storage.getCommit(fromCommitHash))) {
          console.error(
            color(
              "gray",
              `Could not resolve commitHash: ${color("yellow", fromCommitHash)}`
            )
          );
          break;
        }

        if (!(await storage.getCommit(toCommitHash))) {
          console.error(
            color(
              "gray",
              `Could not resolve commitHash: ${color("yellow", toCommitHash)}`
            )
          );
          break;
        }

        const diffObj = await diff(storage, fromCommitHash, toCommitHash);
        console.dir(diffObj, { depth: 5 });

        // save bin file
        if (flags.includes("--save")) {
          const dataPack = await generateDiffPacket(diffObj);
          const savedTopath = "./diff.bin";
          await writeFile(savedTopath, dataPack.data);

          console.log(
            color(
              "blue",
              `saved to ${savedTopath} - ${dataPack.data.length} bytes`
            )
          );
        }

        break;
      }
      case "test": {
        const storageExt = storage.asStorageExt();
        if (!storageExt) break;

        for await (const itm of storageExt.scanObject()) {
          console.log(itm);
        }
        break;
      }
      default:
        console.warn(color("gray", "unknown command"), color("yellow", cmd));
        printHelp();
        break;
    }

    // change stdin color
    process.stdout.write(color("blue", "> "));
  }
}

async function diff(
  storage: IStorageAdapter,
  fromCommit: string,
  toCommit: string
) {
  const diffObj = await findRevisionDiff(storage, fromCommit, toCommit);
  return diffObj;
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

async function fetchCommitHashAtHead(
  storage: IStorageAdapter
): Promise<string | null> {
  const head = await storage.getHead();
  if (!head) return null;
  if (head.type === "ref")
    throw new Error("Currently not support Head point to ref");

  const commitHash = head.value;
  return commitHash;
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
  if (!commitObj)
    throw new Error(color("gray", `Commit at head not found: ${commitHash}`));

  const treeHash = commitObj.tree_hash;
  const treeObj = await storage.getTree(commitObj.tree_hash);
  if (!treeObj)
    throw new Error(color("gray", `Tree at head not found: ${treeHash}`));

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

async function generateDiffPacket(result: DiffResult) {
  const packer = new BsonPackAdapter();
  return packer.packObjects({
    commits: Object.values(result.objects.commits),
    blobs: Object.values(result.objects.blobs),
    trees: Object.values(result.objects.trees),
    metadata: Object.values(result.objects.metadata),
    _header: {
      version: "1",
      timestamp: new Date().toISOString(),
    },
  });
}

main();
