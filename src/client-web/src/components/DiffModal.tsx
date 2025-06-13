import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { listTop10Commits } from "@/lib/appLogic";
import { generateDiff } from "@/lib/appLogic";
import { saveArrayBuffer } from "@/lib/utils";
import type { ICommit, IBlob, ITree, IMetadata } from "@gitblobsdb/interface";
import { Button } from "@/components/ui/button";
import DiffViewer from "./DiffViewer";
import type { DiffResult } from "@gitblobsdb/cores/src/versioning/diff";
import { BsonPackAdapter } from "@gitblobsdb/adapter/src/pack/BsonPackAdapter";

interface DiffModalProps {
  open: boolean;
  onClose: () => void;
}

export function DiffModal({ open, onClose }: DiffModalProps) {
  const { state } = useAppContext();
  const [commits, setCommits] = useState<ICommit[]>([]);
  const [fromCommit, setFromCommit] = useState<string>("");
  const [toCommit, setToCommit] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  useEffect(() => {
    if (open) {
      loadCommits();
      setFromCommit("");
      setToCommit("");
      setDiffResult(null);
    }
  }, [open]);

  const loadCommits = async () => {
    const topCommits = await listTop10Commits(state);
    setCommits(topCommits);
    if (topCommits.length > 0) {
      setToCommit(topCommits[0].hash);
    }
  };

  const handleGenerateDiff = async () => {
    if (!fromCommit || !toCommit) return;

    setIsLoading(true);
    try {
      const dataPack = await generateDiff(state, fromCommit, toCommit);
      const packer = new BsonPackAdapter();
      const unpacked = packer.unpackObjects(dataPack.data);
      const diffResult: DiffResult = {
        commitChains: JSON.parse(unpacked._header.others?.commitChains ?? "[]"),
        objects: {
          commits: Object.fromEntries(
            unpacked.commits.map((itm: ICommit) => [itm.hash, itm])
          ),
          blobs: Object.fromEntries(
            unpacked.blobs.map((itm: IBlob) => [itm.hash, itm])
          ),
          trees: Object.fromEntries(
            unpacked.trees.map((itm: ITree) => [itm.hash, itm])
          ),
          metadata: Object.fromEntries(
            unpacked.metadata.map((itm: IMetadata) => [itm.hash, itm])
          ),
        },
      };
      setDiffResult(diffResult);
    } catch (error) {
      console.error("Error generating diff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!diffResult) return;
    const dataPack = await generateDiff(state, fromCommit, toCommit);
    await saveArrayBuffer(dataPack.data, "diff.bin");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-lg w-[90vw] h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold mb-4">Generate Diff</h2>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              From Commit
            </label>
            <select
              className="w-full p-2 border rounded"
              value={fromCommit}
              onChange={(e) => setFromCommit(e.target.value)}
            >
              <option value="">Select commit</option>
              {commits.map((commit) => (
                <option key={commit.hash} value={commit.hash}>
                  {commit.hash.substring(0, 8)} - {commit.content.message}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">To Commit</label>
            <select
              className="w-full p-2 border rounded"
              value={toCommit}
              onChange={(e) => setToCommit(e.target.value)}
            >
              <option value="">Select commit</option>
              {commits.map((commit) => (
                <option key={commit.hash} value={commit.hash}>
                  {commit.hash.substring(0, 8)} - {commit.content.message}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {diffResult ? (
            <DiffViewer diffResult={diffResult} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Select commits and generate diff to preview
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateDiff}
            disabled={!fromCommit || !toCommit || isLoading}
          >
            {isLoading ? "Generating..." : "Generate Diff"}
          </Button>
          {diffResult && (
            <Button onClick={handleDownload}>Download Diff</Button>
          )}
        </div>
      </div>
    </div>
  );
}
