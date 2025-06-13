import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function saveArrayBuffer(arrayBuffer: Uint8Array, filename: string) {
  const blob = new Blob([arrayBuffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper to get a short hash for display
export const shortHash = (hash: string) => hash.substring(0, 7);

// Helper function to convert Uint8Array to string (for text files)
export const arrayBufferToString = (buffer: Uint8Array): string => {
  try {
    return new TextDecoder().decode(buffer);
  } catch (e) {
    return "[Binary data]";
  }
};

// Helper function to determine if content is likely text
export const isTextContent = (data: Uint8Array): boolean => {
  // Check a sample of bytes to determine if it's likely text
  const sample = data.slice(0, Math.min(100, data.length));
  // Text files typically don't have many null bytes or control characters
  let nullCount = 0;
  let controlCount = 0;

  for (const byte of sample) {
    if (byte === 0) nullCount++;
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) controlCount++;
  }

  // If more than 5% are null or control chars, probably binary
  return (nullCount + controlCount) / sample.length < 0.05;
};
