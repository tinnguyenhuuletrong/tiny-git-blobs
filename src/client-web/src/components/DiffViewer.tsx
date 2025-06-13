import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  GitCommit,
  FileText,
  Folder,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DiffResult } from "@gitblobsdb/cores/src/versioning/diff";
import { arrayBufferToString, isTextContent, shortHash } from "@/lib/utils";

interface DiffViewerProps {
  diffResult: DiffResult;
}

export default function DiffViewer({ diffResult }: DiffViewerProps) {
  const [selectedCommitIndex, setSelectedCommitIndex] = useState(0);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const selectedCommitHash = diffResult.commitChains[selectedCommitIndex];
  const selectedCommit = diffResult.objects.commits[selectedCommitHash];
  const nextCommitHash = diffResult.commitChains[selectedCommitIndex + 1];

  // Get the tree for the selected commit
  const selectedTree = selectedCommit
    ? diffResult.objects.trees[selectedCommit.content.tree_hash]
    : null;

  // Toggle a path's expanded state
  const togglePath = (path: string) => {
    const newExpandedPaths = new Set(expandedPaths);
    if (newExpandedPaths.has(path)) {
      newExpandedPaths.delete(path);
    } else {
      newExpandedPaths.add(path);
    }
    setExpandedPaths(newExpandedPaths);
  };

  // Build a hierarchical tree structure from flat entries
  const fileTree = useMemo(() => {
    if (!selectedTree) return {};

    const tree: Record<string, any> = {};

    Object.entries(selectedTree.content.entries).forEach(([path, entry]) => {
      const parts = path.split("/");
      let current = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // Leaf node (file)
          current[part] = {
            ...entry,
            path,
            isFile: true,
            name: part,
          };
        } else {
          // Directory
          if (!current[part]) {
            current[part] = {
              isDirectory: true,
              name: part,
              children: {},
            };
          }
          current = current[part].children;
        }
      });
    });

    return tree;
  }, [selectedTree]);

  // Get the selected file's blob and metadata
  const selectedFileData = useMemo(() => {
    if (!selectedFilePath || !selectedTree?.content.entries[selectedFilePath])
      return null;

    const entry = selectedTree.content.entries[selectedFilePath];
    const blob = diffResult.objects.blobs[entry.blob_hash];
    const metadata = diffResult.objects.metadata[entry.metadata_hash];

    return { blob, metadata, path: selectedFilePath };
  }, [selectedFilePath, selectedTree, diffResult.objects]);

  // Render tree recursively
  const renderTree = (tree: Record<string, any>, basePath = "") => {
    return Object.entries(tree).map(([name, node]) => {
      const currentPath = basePath ? `${basePath}/${name}` : name;

      if (node.isDirectory) {
        const isExpanded = expandedPaths.has(currentPath);

        return (
          <div key={currentPath} className="ml-1">
            <CollapsibleTrigger
              asChild
              onClick={() => togglePath(currentPath)}
              className="flex items-center gap-1 py-1 hover:bg-muted/50 rounded px-1 w-full text-left"
            >
              <div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 inline" />
                ) : (
                  <ChevronRight className="h-4 w-4 inline" />
                )}
                <Folder className="h-4 w-4 inline text-amber-500 mr-1" />
                <span>{name}</span>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="ml-4 border-l border-border pl-2">
              {isExpanded && renderTree(node.children, currentPath)}
            </CollapsibleContent>
          </div>
        );
      } else {
        // File node
        return (
          <div
            key={currentPath}
            className={`ml-5 py-1 px-1 hover:bg-muted/50 rounded cursor-pointer flex items-center ${
              selectedFilePath === currentPath ? "bg-muted" : ""
            }`}
            onClick={() => setSelectedFilePath(currentPath)}
          >
            <FileText className="h-4 w-4 inline mr-1 text-blue-500" />
            <span className="truncate">{name}</span>
          </div>
        );
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Commit Chain Navigation */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <GitCommit className="mr-2 h-5 w-5" />
            Commit Chain
          </CardTitle>
          <CardDescription>
            {diffResult.commitChains.length} commits in chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea
            className="whitespace-nowrap pb-2"
            // orientation="horizontal"
          >
            <div className="flex items-center gap-1">
              {diffResult.commitChains.map((hash, index) => {
                const commit = diffResult.objects.commits[hash];
                return (
                  <TooltipProvider key={hash}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={
                            selectedCommitIndex === index
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => setSelectedCommitIndex(index)}
                        >
                          <GitCommit className="h-3.5 w-3.5" />
                          {shortHash(hash)}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">{hash}</p>
                        <p className="text-xs mt-1">{commit.content.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {commit.content.author.name} &lt;
                          {commit.content.author.email}&gt;
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(
                            commit.content.author.timestamp
                          ).toLocaleString()}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {/* Left Panel - File Browser */}
        <Card className="md:col-span-1 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Files</CardTitle>
            <CardDescription>
              Tree:{" "}
              {selectedCommit?.content.tree_hash
                ? shortHash(selectedCommit.content.tree_hash)
                : "None"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="p-4">
                <Collapsible defaultOpen>
                  {Object.keys(fileTree).length > 0 ? (
                    renderTree(fileTree)
                  ) : (
                    <div className="text-muted-foreground text-center py-4">
                      No files in this commit
                    </div>
                  )}
                </Collapsible>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel - Details */}
        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <div>
                {selectedCommit && (
                  <>
                    <span className="font-mono text-sm">
                      {shortHash(selectedCommitHash)}
                    </span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span>{selectedCommit.content.message}</span>
                  </>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {selectedCommit && (
                <>
                  {selectedCommit.content.author.name} &lt;
                  {selectedCommit.content.author.email}&gt; •{" "}
                  {new Date(
                    selectedCommit.content.author.timestamp
                  ).toLocaleString()}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="file" className="w-full">
              <div className="border-b px-4">
                <TabsList className="h-10">
                  <TabsTrigger value="file">File Content</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  <TabsTrigger value="commit">Commit Details</TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="p-4">
                  <TabsContent value="file" className="m-0">
                    {selectedFileData ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium">
                            {selectedFilePath}
                          </h3>
                          <Badge variant="outline">
                            {shortHash(selectedFileData.blob.hash)}
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                        <div className="font-mono text-sm bg-muted/30 p-4 rounded-md overflow-auto max-h-[500px]">
                          {isTextContent(selectedFileData.blob.content.data) ? (
                            <pre>
                              {arrayBufferToString(
                                selectedFileData.blob.content.data
                              )}
                            </pre>
                          ) : (
                            <div className="text-center py-4">
                              [Binary content -{" "}
                              {selectedFileData.blob.content.data.length} bytes]
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Select a file to view its content
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="metadata" className="m-0">
                    {selectedFileData && selectedFileData.metadata ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium">
                            {selectedFilePath} - Metadata
                          </h3>
                          <Badge variant="outline">
                            {shortHash(selectedFileData.metadata.hash)}
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                        <div className="font-mono text-sm bg-muted/30 p-4 rounded-md overflow-auto max-h-[500px]">
                          <pre>
                            {JSON.stringify(
                              selectedFileData.metadata.content.data,
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Select a file to view its metadata
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="commit" className="m-0">
                    {selectedCommit && (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium mb-1">
                              Commit Hash
                            </h3>
                            <div className="font-mono text-xs bg-muted/30 p-2 rounded-md">
                              {selectedCommitHash}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium mb-1">
                              Tree Hash
                            </h3>
                            <div className="font-mono text-xs bg-muted/30 p-2 rounded-md">
                              {selectedCommit.content.tree_hash}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-1">
                            Parent Hashes
                          </h3>
                          {selectedCommit.content.parent_hashes.length > 0 ? (
                            <div className="space-y-2">
                              {selectedCommit.content.parent_hashes.map(
                                (hash) => (
                                  <div
                                    key={hash}
                                    className="font-mono text-xs bg-muted/30 p-2 rounded-md"
                                  >
                                    {hash}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">
                              No parent commits (root commit)
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-1">Author</h3>
                          <div className="bg-muted/30 p-2 rounded-md">
                            <div>
                              {selectedCommit.content.author.name} &lt;
                              {selectedCommit.content.author.email}&gt;
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(
                                selectedCommit.content.author.timestamp
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-1">
                            Committer
                          </h3>
                          <div className="bg-muted/30 p-2 rounded-md">
                            <div>
                              {selectedCommit.content.committer.name} &lt;
                              {selectedCommit.content.committer.email}&gt;
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(
                                selectedCommit.content.committer.timestamp
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-1">Message</h3>
                          <div className="bg-muted/30 p-2 rounded-md whitespace-pre-wrap">
                            {selectedCommit.content.message}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
