import { join } from "path";
import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  unlink,
  access,
} from "fs/promises";
import { constants } from "fs";
import type {
  IBlob,
  ICommit,
  IHead,
  IMetadata,
  IObject,
  IRef,
  ITree,
  IStorageAdapter,
} from "../../../interface/src";

export class FileSystemStorageAdapter implements IStorageAdapter {
  private readonly basePath: string;
  private readonly objectsPath: string;
  private readonly treesPath: string;
  private readonly commitsPath: string;
  private readonly metadataPath: string;
  private readonly refsPath: string;
  private readonly headPath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.objectsPath = join(basePath, "objects");
    this.treesPath = join(basePath, "trees");
    this.commitsPath = join(basePath, "commits");
    this.metadataPath = join(basePath, "metadata");
    this.refsPath = join(basePath, "refs");
    this.headPath = join(basePath, "HEAD");
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

  private getObjectPath(hash: string): string {
    return join(this.objectsPath, hash);
  }

  private getTreePath(hash: string): string {
    return join(this.treesPath, hash);
  }

  private getCommitPath(hash: string): string {
    return join(this.commitsPath, hash);
  }

  private getMetadataPath(hash: string): string {
    return join(this.metadataPath, hash);
  }

  private async writeObject(object: IObject): Promise<void> {
    let path: string;
    let dirPath: string;

    switch (object.type) {
      case "blob":
        path = this.getObjectPath(object.hash);
        dirPath = this.objectsPath;
        break;
      case "tree":
        path = this.getTreePath(object.hash);
        dirPath = this.treesPath;
        break;
      case "commit":
        path = this.getCommitPath(object.hash);
        dirPath = this.commitsPath;
        break;
      case "metadata":
        path = this.getMetadataPath(object.hash);
        dirPath = this.metadataPath;
        break;
    }

    await this.ensureDirectoryExists(dirPath);

    if (object.type === "blob") {
      await writeFile(path, object.content as Uint8Array);
    } else {
      await writeFile(path, JSON.stringify(object.content, null, 2));
    }
  }

  private async readObject(
    hash: string,
    type: "blob"
  ): Promise<Uint8Array | null>;
  private async readObject(
    hash: string,
    type: "tree" | "commit" | "metadata"
  ): Promise<Record<string, any> | null>;
  private async readObject(
    hash: string,
    type: "blob" | "tree" | "commit" | "metadata"
  ): Promise<Uint8Array | Record<string, any> | null> {
    try {
      let path: string;
      switch (type) {
        case "blob":
          path = this.getObjectPath(hash);
          break;
        case "tree":
          path = this.getTreePath(hash);
          break;
        case "commit":
          path = this.getCommitPath(hash);
          break;
        case "metadata":
          path = this.getMetadataPath(hash);
          break;
      }

      const content = await readFile(path);

      if (type === "blob") {
        return new Uint8Array(content);
      } else {
        return JSON.parse(content.toString());
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async getObject(hash: string): Promise<IObject | null> {
    // Try each type until we find a match
    for (const type of ["blob", "tree", "commit", "metadata"] as const) {
      if (type === "blob") {
        const content = await this.readObject(hash, type);
        if (content !== null) {
          return { type, hash, content };
        }
      } else {
        const content = await this.readObject(hash, type);
        if (content !== null) {
          return { type, hash, content };
        }
      }
    }
    return null;
  }

  async putObject(object: IObject): Promise<void> {
    await this.writeObject(object);
  }

  async getBlob(hash: string): Promise<IBlob | null> {
    const content = await this.readObject(hash, "blob");
    return content ? { hash, content } : null;
  }

  async putBlob(blob: IBlob): Promise<void> {
    await this.writeObject({
      type: "blob",
      hash: blob.hash,
      content: blob.content,
    });
  }

  async getTree(hash: string): Promise<ITree | null> {
    const content = await this.readObject(hash, "tree");
    return content ? { hash, entries: content } : null;
  }

  async putTree(tree: ITree): Promise<void> {
    await this.writeObject({
      type: "tree",
      hash: tree.hash,
      content: tree.entries,
    });
  }

  async getCommit(hash: string): Promise<ICommit | null> {
    const content = await this.readObject(hash, "commit");
    if (!content) return null;
    return { hash, ...content } as ICommit;
  }

  async putCommit(commit: ICommit): Promise<void> {
    const { hash, ...content } = commit;
    await this.writeObject({ type: "commit", hash, content });
  }

  async getMetadata(hash: string): Promise<IMetadata | null> {
    const content = await this.readObject(hash, "metadata");
    return content ? { hash, data: content } : null;
  }

  async putMetadata(metadata: IMetadata): Promise<void> {
    await this.writeObject({
      type: "metadata",
      hash: metadata.hash,
      content: metadata.data,
    });
  }

  private getRefPath(name: string): string {
    return join(this.refsPath, name);
  }

  async getRef(name: string): Promise<IRef | null> {
    try {
      const path = this.getRefPath(name);
      const commitHash = (await readFile(path)).toString().trim();
      return { name, commit_hash: commitHash };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async updateRef(name: string, commitHash: string): Promise<void> {
    const path = this.getRefPath(name);
    await this.ensureDirectoryExists(
      join(this.refsPath, name.split("/").slice(0, -1).join("/"))
    );
    await writeFile(path, commitHash);
  }

  async listRefs(): Promise<IRef[]> {
    const refs: IRef[] = [];
    const refsDir = join(this.refsPath);
    await this.ensureDirectoryExists(refsDir);

    const files = await readdir(refsDir, { recursive: true });
    for (const file of files) {
      const name = file;
      const ref = await this.getRef(name);
      if (ref) {
        refs.push(ref);
      }
    }

    return refs;
  }

  async getHead(): Promise<IHead | null> {
    try {
      const content = (await readFile(this.headPath)).toString().trim();
      if (content.startsWith("ref: ")) {
        return { type: "ref", value: content.slice(5) };
      } else {
        return { type: "commit", value: content };
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async setHead(head: IHead): Promise<void> {
    const content = head.type === "ref" ? `ref: ${head.value}` : head.value;
    await writeFile(this.headPath, content);
  }

  async hasObject(hash: string): Promise<boolean> {
    // Try each type until we find a match
    for (const type of ["blob", "tree", "commit", "metadata"] as const) {
      let path: string;
      switch (type) {
        case "blob":
          path = this.getObjectPath(hash);
          break;
        case "tree":
          path = this.getTreePath(hash);
          break;
        case "commit":
          path = this.getCommitPath(hash);
          break;
        case "metadata":
          path = this.getMetadataPath(hash);
          break;
      }
      try {
        await access(path, constants.F_OK);
        return true;
      } catch (error) {
        continue;
      }
    }
    return false;
  }

  async deleteObject(hash: string): Promise<void> {
    // Try each type until we find and delete the object
    for (const type of ["blob", "tree", "commit", "metadata"] as const) {
      let path: string;
      switch (type) {
        case "blob":
          path = this.getObjectPath(hash);
          break;
        case "tree":
          path = this.getTreePath(hash);
          break;
        case "commit":
          path = this.getCommitPath(hash);
          break;
        case "metadata":
          path = this.getMetadataPath(hash);
          break;
      }
      try {
        await unlink(path);
        return; // Object found and deleted
      } catch (error) {
        continue;
      }
    }
  }
}

/*
basePath/
├── objects/          # Binary blobs
│   └── [hash]
├── trees/           # Tree objects
│   └── [hash]
├── commits/         # Commit objects
│   └── [hash]
├── metadata/        # Metadata objects
│   └── [hash]
├── refs/           # References
│   └── [branch-name]
└── HEAD            # Current HEAD reference
*/
