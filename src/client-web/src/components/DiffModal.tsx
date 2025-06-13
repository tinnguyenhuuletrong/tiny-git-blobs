import { useState, useEffect } from "react";
import { useAppContext } from "@/context/AppContext";
import { listTop10Commits } from "@/lib/appLogic";
import { generateDiff } from "@/lib/appLogic";
import { saveArrayBuffer } from "@/lib/utils";
import type { ICommit } from "@gitblobsdb/interface";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    if (open) {
      loadCommits();
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
      await saveArrayBuffer(dataPack.data, "diff.bin");
      onClose();
    } catch (error) {
      console.error("Error generating diff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">Generate Diff</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">From Commit</label>
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

        <div className="mb-4">
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

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateDiff}
            disabled={!fromCommit || !toCommit || isLoading}
          >
            {isLoading ? "Generating..." : "Generate Diff"}
          </Button>
        </div>
      </div>
    </div>
  );
}
