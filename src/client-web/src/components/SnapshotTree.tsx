import React from "react";
import type { ITree, ITreeEntry } from "../types";
import { Button } from "./ui/button";

interface SnapshotTreeProps {
  tree: ITree;
  onPreview: (filePath: string) => void;
  onDownload: (filePath: string) => void;
}

export const SnapshotTree: React.FC<SnapshotTreeProps> = ({
  tree,
  onPreview,
  onDownload,
}) => {
  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-md flex flex-col gap-2">
      <h2 className="text-lg font-semibold mb-2">Snapshot Tree</h2>
      <ul className="flex flex-col gap-2">
        {Object.entries(tree.entries).map(([filePath, entry]) => {
          const treeEntry = entry as ITreeEntry;
          return (
            <li
              key={filePath}
              className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 last:border-b-0 gap-1"
            >
              <div className="flex-1 w-1/2">
                <div className="font-mono text-sm break-all">{filePath}</div>
                <div className="text-xs text-muted-foreground truncate">
                  Blob: {treeEntry.blob_hash}
                </div>
                <div className="text-xs text-muted-foreground">
                  Metadata: {treeEntry.metadata_hash}
                </div>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreview(filePath)}
                >
                  Preview
                </Button>
                <Button size="sm" onClick={() => onDownload(filePath)}>
                  Download
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
