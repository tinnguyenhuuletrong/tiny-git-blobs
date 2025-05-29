import { join } from "path";
import { mkdir, readFile, writeFile, access, unlink } from "fs/promises";
import {
  type IBlob,
  type ICommit,
  type IHead,
  type IMetadata,
  type IObject,
  type IRef,
  type ITree,
  type IStorageAdapter,
} from "@gitblobsdb/interface";
import { R_OK } from "constants";

async function exists(diskPath: string): Promise<boolean> {
  try {
    await access(diskPath, R_OK);
    return true;
  } catch {
    return false;
  }
}

export class FileSystemStorageAdapter implements IStorageAdapter {
  private readonly basePath: string;
  private readonly objectsPath: string;
  private readonly metadataPath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.objectsPath = join(basePath, "objects");
    this.metadataPath = join(basePath, "metadata");
  }

  private async ensureDirectoryExists(path: string): Promise<void> {
    try {
      await mkdir(path, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
    }
  }

  async getObject(hash: string): Promise<IObject | null> {
    const loadPath = join(this.objectsPath, `${hash}.json`);
    const hasExist = await exists(loadPath);
    if (!hasExist) {
      return null;
    }
    const data = await readFile(loadPath);
    return JSON.parse(data.toString()) as IObject;
  }

  async putObject(object: IObject): Promise<void> {
    await this.ensureDirectoryExists(this.objectsPath);

    const savePath = join(this.objectsPath, `${object.hash}.json`);
    await writeFile(savePath, JSON.stringify(object));
  }

  async hasObject(hash: string): Promise<boolean> {
    const loadPath = join(this.objectsPath, `${hash}.json`);
    const hasExist = await exists(loadPath);
    if (!hasExist) {
      return false;
    }
    return true;
  }

  async deleteObject(hash: string): Promise<void> {
    const loadPath = join(this.objectsPath, `${hash}.json`);
    await unlink(loadPath);
  }

  async getBlob(hash: string): Promise<IBlob | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "blob") {
      return {
        hash: obj.hash,
        content: Uint8Array.from(obj.content as Uint8Array),
      };
    }
    return null;
  }

  async putBlob(blob: IBlob): Promise<void> {
    await this.putObject({
      type: "blob",
      hash: blob.hash,
      content: Array.from(blob.content),
    });
  }

  async getTree(hash: string): Promise<ITree | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "tree") {
      return {
        hash: obj.hash,
        entries: obj.content as Record<string, any>,
      };
    }
    return null;
  }

  async putTree(tree: ITree): Promise<void> {
    await this.putObject({
      type: "tree",
      hash: tree.hash,
      content: tree.entries,
    });
  }

  async getCommit(hash: string): Promise<ICommit | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "commit") {
      const content = obj.content as Record<string, any>;
      return {
        hash: obj.hash,
        tree_hash: content.tree_hash,
        parent_hashes: content.parent_hashes,
        author: content.author,
        committer: content.committer,
        message: content.message,
      };
    }
    return null;
  }

  async putCommit(commit: ICommit): Promise<void> {
    const { hash, ...content } = commit;
    await this.putObject({
      type: "commit",
      hash,
      content,
    });
  }

  async getMetadata(hash: string): Promise<IMetadata | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "metadata") {
      return {
        hash: obj.hash,
        data: obj.content as Record<string, any>,
      };
    }
    return null;
  }

  async putMetadata(metadata: IMetadata): Promise<void> {
    await this.putObject({
      type: "metadata",
      hash: metadata.hash,
      content: metadata.data,
    });
  }

  private async loadRefsFromDisk(): Promise<IRef[]> {
    const loadPath = join(this.metadataPath, "refs.json");
    const hasExist = await exists(loadPath);
    if (!hasExist) {
      return [];
    }
    const data = await readFile(loadPath);
    return JSON.parse(data.toString()) as IRef[];
  }

  private async saveRefsToDisk(refs: IRef[]): Promise<void> {
    await this.ensureDirectoryExists(this.metadataPath);
    const savePath = join(this.metadataPath, "refs.json");

    await writeFile(savePath, JSON.stringify(refs));
  }

  async getRef(name: string): Promise<IRef | null> {
    const refs = await this.listRefs();
    return refs.find((itm) => itm.name === name) ?? null;
  }

  async updateRef(name: string, commitHash: string): Promise<void> {
    const refs = await this.listRefs();
    const itm = refs.find((itm) => itm.name === name);
    if (itm) itm.commit_hash = commitHash;
    else {
      refs.push({
        name,
        commit_hash: commitHash,
      });
    }

    await this.saveRefsToDisk(refs);
  }

  async listRefs(): Promise<IRef[]> {
    return this.loadRefsFromDisk();
  }

  async getHead(): Promise<IHead | null> {
    const loadPath = join(this.metadataPath, "head.json");
    const hasExist = await exists(loadPath);
    if (!hasExist) {
      return null;
    }
    const data = await readFile(loadPath);
    return JSON.parse(data.toString()) as IHead;
  }

  async setHead(head: IHead): Promise<void> {
    await this.ensureDirectoryExists(this.metadataPath);
    const savePath = join(this.metadataPath, "head.json");
    await writeFile(savePath, JSON.stringify(head));
  }
}

/*
basePath/
├── objects/          # Binary blobs | Tree objects | Commit objects | Metadata objects
│   └── [hash]
├── metadata/         # high level metadata
│   └── head.json
│   └── refs.json
*/
