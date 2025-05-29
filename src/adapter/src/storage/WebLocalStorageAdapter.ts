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

export class WebLocalStorageAdapter implements IStorageAdapter {
  private readonly prefix: string;
  private readonly objectsPrefix: string;
  private readonly refsPrefix: string;
  private readonly headKey: string;

  constructor(prefix: string = "gitblobsdb") {
    this.prefix = prefix;
    this.objectsPrefix = `${prefix}/objects/`;
    this.refsPrefix = `${prefix}/refs/`;
    this.headKey = `${prefix}/head`;
  }

  private getObjectKey(hash: string): string {
    return `${this.objectsPrefix}${hash}`;
  }

  private getRefKey(name: string): string {
    return `${this.refsPrefix}${name}`;
  }

  async getObject(hash: string): Promise<IObject | null> {
    const data = localStorage.getItem(this.getObjectKey(hash));
    if (!data) return null;
    return JSON.parse(data) as IObject;
  }

  async putObject(object: IObject): Promise<void> {
    localStorage.setItem(
      this.getObjectKey(object.hash),
      JSON.stringify(object)
    );
  }

  async getBlob(hash: string): Promise<IBlob | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "blob") {
      return {
        hash: obj.hash,
        content: Uint8Array.from(obj.content as number[]),
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

  async getRef(name: string): Promise<IRef | null> {
    const data = localStorage.getItem(this.getRefKey(name));
    if (!data) return null;
    return JSON.parse(data) as IRef;
  }

  async updateRef(name: string, commitHash: string): Promise<void> {
    const ref: IRef = {
      name,
      commit_hash: commitHash,
    };
    localStorage.setItem(this.getRefKey(name), JSON.stringify(ref));
  }

  async listRefs(): Promise<IRef[]> {
    const refs: IRef[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.refsPrefix)) {
        const data = localStorage.getItem(key);
        if (data) {
          refs.push(JSON.parse(data) as IRef);
        }
      }
    }
    return refs;
  }

  async getHead(): Promise<IHead | null> {
    const data = localStorage.getItem(this.headKey);
    if (!data) return null;
    return JSON.parse(data) as IHead;
  }

  async setHead(head: IHead): Promise<void> {
    localStorage.setItem(this.headKey, JSON.stringify(head));
  }

  async hasObject(hash: string): Promise<boolean> {
    return localStorage.getItem(this.getObjectKey(hash)) !== null;
  }

  async deleteObject(hash: string): Promise<void> {
    localStorage.removeItem(this.getObjectKey(hash));
  }
}
