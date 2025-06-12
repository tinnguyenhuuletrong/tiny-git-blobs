import { parseArgs } from "util";
import { join, resolve } from "path";
import { FileSystemStorageAdapter } from "@gitblobsdb/adapter";
import {
  createTree,
  createBlob,
  createCommit,
  SnapshotHelper,
  DiffHelper,
  MergeHelper,
  FastForwardHelper,
} from "@gitblobsdb/cores";
import { cwd } from "process";
import {
  IBlob,
  ICommit,
  IMetadata,
  IPackObject,
  IPackResult,
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
import { writeFile, access } from "fs/promises";
import { constants } from "fs/promises";
import { readFile } from "fs/promises";

// Define an enum for commands
enum Command {
  Help = "help",
  Head = "head",
  Add = "add",
  GetBlob = "getBlob",
  History = "history",
  Snapshot = "snapshot",
  Diff = "diff",
  ApplyDiff = "applyDiff",
  Export = "export",
  Import = "import",
}

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
    color(
      "gray",
      `\t${color(
        "blue",
        Command.Head
      )}: Fetch and display the current head commit.`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.Add)} ${color(
        "yellow",
        "<fileName> <fileContent>"
      )}: Add a new file with the specified content.`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.GetBlob)} ${color(
        "yellow",
        "<blobHash>"
      )}: Retrieve and display the content of a blob by its hash.`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.History)}: Display the commit history.`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.Help)}: Display this help message.`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.Snapshot)} ${color(
        "yellow",
        "[--save] [commitHash]"
      )}: Retrieve a snapshot of the repository state at a specific commit (defaults to head if not provided).`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.Export)} ${color(
        "yellow",
        "[path]"
      )}: Export the entire storage to a binary file. (default path is ./backup.bin)`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.Import)} ${color(
        "yellow",
        "<importPath>"
      )}: Import a backup from the specified path.`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.Diff)} ${color(
        "yellow",
        "[--save] [fromCommitHash] [toCommitHash]"
      )}: Generate diff package update data from fromCommitHash to toCommitHash. (default fromCommitHash is head)`
    )
  );
  console.log(
    color(
      "gray",
      `\t${color("blue", Command.ApplyDiff)} ${color(
        "yellow",
        "<diffPath>"
      )}: Apply a diff from the specified path (output from Command.Diff).`
    )
  );
}

function printCommitHistory(newToOldCommits: ICommit[]) {
  newToOldCommits.forEach((commit, index) => {
    const isHead = index === 0; // Assuming the first commit in the array is the head
    if (isHead) {
      console.log(color("cyan", "* HEAD")); // Arrow pointing to the head commit
    }
    console.log(`commit ${color(isHead ? "cyan" : "yellow", commit.hash)}`);
    console.log(
      `Author: ${commit.content.author.name} <${commit.content.author.email}>`
    );
    console.log(
      `Date: ${new Date(commit.content.author.timestamp).toLocaleString()}`
    );
    console.log(`\n    ${commit.content.message}\n`);
  });
}

function printSnapshot(snapshot: ITreeSnapshot) {
  console.log(`commitHash: ${color("yellow", snapshot.commitHash)}`); // Yellow color for commitHash
  console.log(`treeHash: ${color("yellow", snapshot.treeHash)}`); // Yellow color for commitHash

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
    switch (cmd as Command) {
      case Command.Help: {
        printHelp();
        break;
      }
      case Command.Head: {
        const head = await fetchHead(storage);
        console.dir(head, { depth: 10 });
        break;
      }
      case Command.Add: {
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
      case Command.GetBlob: {
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
        console.log(decoder.decode(blobObj.content.data));
        break;
      }
      case Command.History: {
        const newToOldCommits = (await listTopCommit(storage, 100)) ?? [];
        printCommitHistory(newToOldCommits);
        break;
      }
      case Command.Snapshot: {
        const flags = args.filter((itm) => itm.startsWith("-"));
        const params = args.filter((itm) => !itm.startsWith("-"));
        let commitHash = params[0];
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

          if (flags.includes("--save")) {
            const dataPack = await generateHeadSnapshotPacket(storage);
            const savedTopath = "./backup_compact.bin";
            await writeFile(savedTopath, dataPack.data);

            console.log(
              color(
                "blue",
                `saved to ${savedTopath} - ${dataPack.data.length} bytes`
              )
            );
          }
        } catch (err: any) {
          console.warn(color("gray", err.message));
        }

        break;
      }
      case Command.Diff: {
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
      case Command.Export: {
        const savedTopath = args[0] || "./backup.bin";
        const dataPack = await generateBackupPacket(storage);
        if (!dataPack) {
          console.error(color("gray", `Storage Adapter don't support this`));
          break;
        }
        await writeFile(savedTopath, dataPack.data);

        console.log(
          color(
            "blue",
            `saved to ${savedTopath} - ${dataPack.data.length} bytes`
          )
        );

        break;
      }
      case Command.Import: {
        const importPath = args[0];

        const bufData = await readFileAtPath(importPath);
        if (!bufData) break;
        await replaceStorageWithBackup(storage, bufData);

        const commit = await fetchCommitHashAtHead(storage);
        console.log(`done. head commit: ${color("yellow", commit || "")}`);
        break;
      }
      case Command.ApplyDiff: {
        const diffPath = args[0];
        const bufData = await readFileAtPath(diffPath);
        if (!bufData) break;

        try {
          const res = await applyDiff(storage, bufData);
          if (res.isSuccess) {
            const head = await fetchHead(storage);
            console.log(
              `done. head commit: ${color(
                "yellow",
                head?.commit.hash || ""
              )} - ${head?.commit.content.message}`
            );
          }
        } catch (err: unknown) {
          console.error(
            color("blue", `conflict : %O`),
            (err as Error)?.message
          );
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

async function readFileAtPath(path: string) {
  if (!path) {
    console.error(color("gray", `path is missing`));
    return null;
  }

  try {
    await access(path, constants.R_OK);
  } catch (err: any) {
    console.error(
      color(
        "gray",
        `file is not exists or insufficient permission to access at ${path}`
      )
    );
    return null;
  }

  const bufData = await readFile(path);
  return bufData;
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

  const treeHash = commitObj.content.tree_hash;
  const treeObj = await storage.getTree(commitObj.content.tree_hash);
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

    for (const hash of commitObj.content.parent_hashes) {
      queue.push(hash);
    }
  }
}

async function generateDiffPacket(result: DiffResult) {
  const packer = new BsonPackAdapter();
  return packer.packObjects(diffResultToPackObject(result));
}

async function generateHeadSnapshotPacket(
  storage: IStorageAdapter
): Promise<IPackResult> {
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
  if (!currentHead) throw new Error("HEAD not found");

  const trimHeadCommit = structuredClone(currentHead.commit);

  // detect parent
  trimHeadCommit.content.parent_hashes = [];

  // head commit
  packObject.commits.push(trimHeadCommit);

  // head tree
  packObject.trees.push(currentHead.tree);

  // blob & metadata
  for (const itm of Object.values(currentHead.tree.content.entries)) {
    const blobObj = await storage.getBlob(itm.blob_hash);
    if (blobObj) packObject.blobs.push(blobObj);

    if (itm.metadata_hash) {
      const metaObj = await storage.getMetadata(itm.metadata_hash);
      if (metaObj) packObject.metadata.push(metaObj);
    }
  }

  others["commit_head"] = currentHead?.commit.hash || "";
  others["tree_head"] = currentHead?.tree.hash || "";

  const packer = new BsonPackAdapter();
  const res = packer.packObjects(packObject);
  return res;
}

async function generateBackupPacket(storage: IStorageAdapter) {
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

async function replaceStorageWithBackup(
  storage: IStorageAdapter,
  bufData: Buffer
) {
  const storageExt = storage.asStorageExt?.();
  if (!storageExt) return null;

  const packer = new BsonPackAdapter();
  const packObj = packer.unpackObjects(bufData);

  await storageExt.replaceWithStorageSnapshot(packObj);

  return true;
}

async function applyDiff(storage: IStorageAdapter, bufData: Buffer) {
  const packer = new BsonPackAdapter();
  const packObj = packer.unpackObjects(bufData);

  const diffResult = packObjectToDiffResult(packObj);

  const res = await FastForwardHelper.fastForward(storage, diffResult);
  return res;
}

function diffResultToPackObject(result: DiffResult): IPackObject {
  return {
    commits: Object.values(result.objects.commits),
    blobs: Object.values(result.objects.blobs),
    trees: Object.values(result.objects.trees),
    metadata: Object.values(result.objects.metadata),
    _header: {
      version: "1",
      timestamp: new Date().toISOString(),
      others: {
        commitChains: JSON.stringify(result.commitChains),
      },
    },
  };
}

function packObjectToDiffResult(pack: IPackObject): DiffResult {
  return {
    commitChains: JSON.parse(pack._header.others?.commitChains ?? "[]"),
    objects: {
      commits: Object.fromEntries(pack.commits.map((itm) => [itm.hash, itm])),
      blobs: Object.fromEntries(pack.blobs.map((itm) => [itm.hash, itm])),
      trees: Object.fromEntries(pack.trees.map((itm) => [itm.hash, itm])),
      metadata: Object.fromEntries(pack.metadata.map((itm) => [itm.hash, itm])),
    },
  };
}

main();
