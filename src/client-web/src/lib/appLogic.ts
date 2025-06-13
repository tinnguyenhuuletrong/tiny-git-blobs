import type { IAppState, Action } from "@/types";
import { WebLocalStorageAdapter } from "@gitblobsdb/adapter/src/storage/WebLocalStorageAdapter";
import * as CoreOps from "./coreOpts";

export async function appStartingUp(
  state: IAppState,
  dispatch: React.ActionDispatch<[action: Action]>
) {
  const storage = new WebLocalStorageAdapter("dev");

  let head = await CoreOps.fetchHead(storage);

  if (!head) {
    console.log("init new repo");
    // mock some commit
    await CoreOps.addFile(storage, "dummy.txt", "this is a dummy file");
  }

  dispatch({
    type: "APP_STARTUP_END",
    payload: { storage },
  });

  head = await CoreOps.fetchHead(storage);
  if (head) {
    dispatch({
      type: "SET_COMMIT_HEAD",
      payload: head,
    });
  }
}

export async function downloadBlobData(state: IAppState, blob_hash: string) {
  const blobObj = await state.core.storage?.getBlob(blob_hash);
  if (!blobObj) return null;
  return blobObj.content.data;
}

export async function listTop10Commits(state: IAppState) {
  const storage = state.core.storage;
  if (!storage) return [];

  const res = await CoreOps.listTopCommit(storage, 10);
  if (!res) return [];
  return res;
}

export async function updateFileData(
  state: IAppState,
  fileName: string,
  fileData: string
) {
  const storage = state.core.storage;
  if (!storage) throw new Error("No storage");
  await CoreOps.updateFile(storage, fileName, fileData);
  const head = await CoreOps.fetchHead(storage);
  return head?.tree;
}

export async function deleteFileData(state: IAppState, fileName: string) {
  const storage = state.core.storage;
  if (!storage) throw new Error("No storage");
  await CoreOps.deleteFile(storage, fileName);
  const head = await CoreOps.fetchHead(storage);
  return head?.tree;
}

export async function exportStorageData(state: IAppState) {
  const storage = state.core.storage;
  if (!storage) return null;
  return await CoreOps.exportStorage(storage);
}

export async function importStorageData(
  state: IAppState,
  bufData: ArrayBuffer
) {
  const storage = state.core.storage;
  if (!storage) return null;
  return await CoreOps.importStorage(storage, bufData);
}
