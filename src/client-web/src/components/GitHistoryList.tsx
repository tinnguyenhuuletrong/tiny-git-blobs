import React from "react";
import type { ICommit } from "../types";

interface GitHistoryListProps {
  commits: ICommit[];
}

export const GitHistoryList: React.FC<GitHistoryListProps> = ({ commits }) => (
  <ul className="flex flex-col gap-3 w-full">
    {commits.map((commit) => (
      <li
        key={commit.hash}
        className="p-3 rounded-lg bg-muted shadow-sm flex flex-col gap-1"
      >
        <div className="text-xs text-muted-foreground font-mono break-all">
          {commit.hash}
        </div>
        <div className="text-sm font-semibold">{commit.message}</div>
        <div className="text-xs">
          Author: {commit.author.name} ({commit.author.email})
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(commit.author.timestamp).toLocaleString()}
        </div>
      </li>
    ))}
  </ul>
);
