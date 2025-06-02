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
    await CoreOps.addFile(storage, "file_01.txt", "this is content of file 01");
  }

  dispatch({
    type: "APP_STARTUP_END",
    payload: { storage },
  });

  head = await CoreOps.fetchHead(storage);
  if (head) {
    dispatch({
      type: "SET_TREE_SNAPSHOT",
      payload: head?.tree,
    });
  }
}

export async function downloadBlobData(state: IAppState, blob_hash: string) {
  const blobObj = await state.core.storage?.getBlob(blob_hash);
  if (!blobObj) return null;
  return blobObj.content;
}

export async function listTop10Commits(state: IAppState) {
  const storage = state.core.storage;
  if (!storage) return [];

  const res = await CoreOps.listTopCommit(storage, 10);
  if (!res) return [];
  return res;
}
