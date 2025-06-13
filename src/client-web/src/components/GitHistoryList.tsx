import React from "react";
import type { ICommit } from "../types";

interface GitHistoryListProps {
  commits: ICommit[];
  onSelectCommit?: (commit: ICommit) => void;
  selectedCommit?: ICommit | null;
}

export const GitHistoryList: React.FC<GitHistoryListProps> = ({
  commits,
  onSelectCommit,
  selectedCommit,
}) => {
  return (
    <div className="space-y-2">
      {commits.map((commit) => (
        <div
          key={commit.hash}
          className={`p-3 rounded-lg cursor-pointer transition-colors ${
            selectedCommit?.hash === commit.hash
              ? "bg-primary/10 border border-primary"
              : "bg-muted/50 hover:bg-muted"
          }`}
          onClick={() => onSelectCommit?.(commit)}
        >
          <div className="flex flex-col gap-1">
            <div className="font-mono text-sm">{commit.hash}</div>
            <div className="text-sm text-muted-foreground">
              {commit.content.message}
            </div>
            <div className="text-xs text-muted-foreground">
              {commit.content.author.name} ({commit.content.author.email})
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
