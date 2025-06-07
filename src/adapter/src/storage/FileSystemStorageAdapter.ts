import { join } from "path";
import {
  mkdir,
  readFile,
  writeFile,
  access,
  unlink,
  readdir,
} from "fs/promises";
import type {
  IBlob,
  ICommit,
  IHead,
  IMetadata,
  IObject,
  IRef,
  ITree,
  IStorageAdapter,
  IStorageAdapterEx,
  IPackObject,
} from "@gitblobsdb/interface";
import { R_OK } from "constants";
import { rm } from "fs/promises";

async function exists(diskPath: string): Promise<boolean> {
  try {
    await access(diskPath, R_OK);
    return true;
  } catch {
    return false;
  }
}

export class FileSystemStorageAdapter
  implements IStorageAdapter, IStorageAdapterEx
{
  private readonly basePath: string;
  private readonly objectsPath: string;
  private readonly refsPath: string;
  private readonly headPath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.objectsPath = join(basePath, "objects");
    this.refsPath = join(basePath, "refs");
    this.headPath = join(basePath, "HEAD");
  }

  private async ensureDirectoryExists(path: string) {
    await mkdir(path, { recursive: true });
  }

  private getObjectPath(hash: string): string {
    return join(this.objectsPath, hash);
  }

  private getRefPath(name: string): string {
    return join(this.refsPath, name);
  }

  private async writeObject(object: IObject): Promise<void> {
    const path = this.getObjectPath(object.hash);
    await this.ensureDirectoryExists(this.objectsPath);

    let content: string;
    if (object.type === "blob") {
      const blob = object as IBlob;
      content = JSON.stringify({
        ...blob,
        content: {
          data: Array.from(blob.content.data),
        },
      });
    } else {
      content = JSON.stringify(object);
    }

    await writeFile(path, content, "utf-8");
  }

  private async readObject(hash: string): Promise<IObject | null> {
    const path = this.getObjectPath(hash);
    try {
      const content = await readFile(path, "utf-8");
      const obj = JSON.parse(content);

      if (obj.type === "blob") {
        return {
          ...obj,
          content: {
            data: new Uint8Array(obj.content.data),
          },
        };
      }
      return obj;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async getObject(hash: string): Promise<IObject | null> {
    return this.readObject(hash);
  }

  async putObject(object: IObject): Promise<void> {
    await this.writeObject(object);
  }

  async getBlob(hash: string): Promise<IBlob | null> {
    const object = await this.getObject(hash);
    if (!object || object.type !== "blob") {
      return null;
    }
    return object as IBlob;
  }

  async putBlob(blob: IBlob): Promise<void> {
    await this.putObject(blob);
  }

  async getTree(hash: string): Promise<ITree | null> {
    const object = await this.getObject(hash);
    if (!object || object.type !== "tree") {
      return null;
    }
    return object as ITree;
  }

  async putTree(tree: ITree): Promise<void> {
    await this.putObject(tree);
  }

  async getCommit(hash: string): Promise<ICommit | null> {
    const object = await this.getObject(hash);
    if (!object || object.type !== "commit") {
      return null;
    }
    return object as ICommit;
  }

  async putCommit(commit: ICommit): Promise<void> {
    await this.putObject(commit);
  }

  async getMetadata(hash: string): Promise<IMetadata | null> {
    if (!hash) return null;
    const object = await this.getObject(hash);
    if (!object || object.type !== "metadata") {
      return null;
    }
    return object as IMetadata;
  }

  async putMetadata(metadata: IMetadata): Promise<void> {
    await this.putObject(metadata);
  }

  async getRef(name: string): Promise<IRef | null> {
    const path = this.getRefPath(name);
    if (!(await exists(path))) {
      return null;
    }

    const data = await readFile(path);
    return JSON.parse(data.toString());
  }

  async updateRef(name: string, commitHash: string): Promise<void> {
    await this.ensureDirectoryExists(this.refsPath);
    const path = this.getRefPath(name);
    const ref: IRef = { name, commit_hash: commitHash };
    await writeFile(path, JSON.stringify(ref));
  }

  async listRefs(): Promise<IRef[]> {
    if (!(await exists(this.refsPath))) {
      return [];
    }

    const files = await readdir(this.refsPath);
    const refs: IRef[] = [];

    for (const file of files) {
      const ref = await this.getRef(file);
      if (ref) {
        refs.push(ref);
      }
    }

    return refs;
  }

  async getHead(): Promise<IHead | null> {
    if (!(await exists(this.headPath))) {
      return null;
    }

    const data = await readFile(this.headPath);
    return JSON.parse(data.toString());
  }

  async setHead(head: IHead): Promise<void> {
    await writeFile(this.headPath, JSON.stringify(head));
  }

  async hasObject(hash: string): Promise<boolean> {
    return await exists(this.getObjectPath(hash));
  }

  async deleteObject(hash: string): Promise<void> {
    const path = this.getObjectPath(hash);
    if (await exists(path)) {
      await unlink(path);
    }
  }

  asStorageExt(): IStorageAdapterEx | null {
    return this as IStorageAdapterEx;
  }

  // IStorageAdapterEx
  //---------------------------------------------------//

  /**
   * Scans the objects directory and yields each object found.
   *
   * This method iterates through the files in the objects directory, attempts to parse each file as an object,
   * and yields the object if parsing is successful. This allows for efficient iteration over the objects
   * in the storage without having to load all objects into memory at once.
   *
   * @returns An async generator that yields each object found in the objects directory.
   */
  async *scanObject(): AsyncGenerator<IObject> {
    if (!(await exists(this.objectsPath))) {
      return;
    }

    const files = await readdir(this.objectsPath);
    for (const file of files) {
      const object = await this.getObject(file);
      if (object) {
        yield object;
      }
    }
  }

  /**
   * Replaces the current storage with a snapshot of the provided data.
   *
   * This method cleans up the existing repository, recreates the necessary directories,
   * extracts and stores the objects from the snapshot data, and finally sets the head to the specified commit.
   *
   * @param snapshotData - The snapshot data to replace the current storage with.
   * @returns A promise that resolves to true if the operation was successful.
   */
  async replaceWithStorageSnapshot(snapshotData: IPackObject) {
    const head = snapshotData._header.others?.["commit_head"];
    if (!head)
      throw new Error(
        "snapshotData missing _header.others.commit_head. anything wrong ?"
      );

    // cleanup repo
    await rm(this.basePath, { recursive: true, force: true });

    // recreate dir
    await this.ensureDirectoryExists(this.objectsPath);
    await this.ensureDirectoryExists(this.refsPath);

    // extract object
    await Promise.all([
      Promise.all(snapshotData.blobs.map(this.putBlob.bind(this))),
      Promise.all(snapshotData.commits.map(this.putCommit.bind(this))),
      Promise.all(snapshotData.metadata.map(this.putMetadata.bind(this))),
      Promise.all(snapshotData.trees.map(this.putTree.bind(this))),
    ]);

    // set head
    await this.setHead({
      type: "commit",
      value: head,
    });

    return true;
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
