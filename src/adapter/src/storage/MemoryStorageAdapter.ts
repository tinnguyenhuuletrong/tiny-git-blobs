import {
  type IBlob,
  type ICommit,
  type IHead,
  type IMetadata,
  type IObject,
  type IRef,
  type ITree,
  type IStorageAdapter,
  IStorageAdapterEx,
} from "@gitblobsdb/interface";

export class MemoryStorageAdapter implements IStorageAdapter {
  private objects: Map<string, IObject> = new Map();
  private refs: Map<string, IRef> = new Map();
  private head: IHead | null = null;

  async getObject(hash: string): Promise<IObject | null> {
    return this.objects.get(hash) || null;
  }

  async putObject(object: IObject): Promise<void> {
    this.objects.set(object.hash, object);
  }

  async getBlob(hash: string): Promise<IBlob | null> {
    const obj = await this.getObject(hash);
    if (obj?.type === "blob") {
      return obj as IBlob;
    }
    return null;
  }

  async putBlob(blob: IBlob): Promise<void> {
    await this.putObject(blob);
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
    return this.refs.get(name) || null;
  }

  async updateRef(name: string, commitHash: string): Promise<void> {
    this.refs.set(name, { name, commit_hash: commitHash });
  }

  async listRefs(): Promise<IRef[]> {
    return Array.from(this.refs.values());
  }

  async getHead(): Promise<IHead | null> {
    return this.head;
  }

  async setHead(head: IHead): Promise<void> {
    this.head = head;
  }

  async hasObject(hash: string): Promise<boolean> {
    return this.objects.has(hash);
  }

  async deleteObject(hash: string): Promise<void> {
    this.objects.delete(hash);
  }

  asStorageExt(): IStorageAdapterEx | null {
    return null;
  }
}
