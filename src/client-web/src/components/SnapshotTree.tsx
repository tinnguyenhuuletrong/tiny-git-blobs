import React from "react";
import type { ITree, ITreeEntry } from "../types";
import { Button } from "./ui/button";
import { FaRegEye, FaDownload, FaEdit, FaTrash } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SnapshotTreeProps {
  tree: ITree;
  onPreview: (filePath: string) => void;
  onDownload: (filePath: string) => void;
  onEdit?: (filePath: string, blobHash: string) => void;
  onDelete?: (filePath: string) => void;
}

export const SnapshotTree: React.FC<SnapshotTreeProps> = ({
  tree,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-md flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {Object.entries(tree.content.entries).map(
          ([filePath, entry], idx, arr) => {
            const treeEntry = entry as ITreeEntry;
            return (
              <li
                key={filePath}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/50 hover:bg-muted transition rounded-lg px-3 py-2 gap-1 shadow-sm border border-border/40"
                style={{ marginBottom: idx !== arr.length - 1 ? "0.5rem" : 0 }}
              >
                <div className="flex-1 w-1/2 flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-mono text-sm break-all font-medium text-foreground">
                    <span role="img" aria-label="file">
                      📄
                    </span>
                    <span>{filePath}</span>
                  </div>
                  <div className="flex flex-col flex-wrap gap-1 text-xs text-muted-foreground">
                    <span className="truncate max-w-[180px]">
                      Blob: {treeEntry.blob_hash}
                    </span>
                    <span className="truncate max-w-[120px]">
                      Metadata: {treeEntry.metadata_hash}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 mt-2 sm:mt-0 flex-wrap justify-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="p-2"
                        onClick={() => onPreview(filePath)}
                      >
                        <FaRegEye />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Preview</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="p-2"
                        onClick={() => onDownload(filePath)}
                      >
                        <FaDownload />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download</p>
                    </TooltipContent>
                  </Tooltip>
                  {onEdit && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="p-2"
                          onClick={() => onEdit(filePath, treeEntry.blob_hash)}
                        >
                          <FaEdit />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="p-2 text-destructive"
                          onClick={() => onDelete(filePath)}
                        >
                          <FaTrash />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </li>
            );
          }
        )}
      </ul>
    </div>
  );
};
