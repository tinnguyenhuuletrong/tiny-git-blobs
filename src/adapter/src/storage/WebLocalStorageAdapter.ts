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
} from "@gitblobsdb/interface";

export class WebLocalStorageAdapter implements IStorageAdapter {
  public readonly prefix: string;
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
      const data = (obj as IBlob).content.data;
      return {
        ...obj,
        content: {
          data: Uint8Array.from(data),
        },
      } as IBlob;
    }
    return null;
  }

  async putBlob(blob: IBlob): Promise<void> {
    await this.putObject({
      type: "blob",
      hash: blob.hash,
      content: { data: Array.from(blob.content.data) },
    });
  }

  async getTree(hash: string): Promise<ITree | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "tree") {
      return obj as ITree;
    }
    return null;
  }

  async putTree(tree: ITree): Promise<void> {
    await this.putObject(tree);
  }

  async getCommit(hash: string): Promise<ICommit | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "commit") {
      return obj as ICommit;
    }
    return null;
  }

  async putCommit(commit: ICommit): Promise<void> {
    await this.putObject(commit);
  }

  async getMetadata(hash: string): Promise<IMetadata | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "metadata") {
      return obj as IMetadata;
    }
    return null;
  }

  async putMetadata(metadata: IMetadata): Promise<void> {
    await this.putObject(metadata);
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

  asStorageExt(): IStorageAdapterEx | null {
    return null;
  }
}
