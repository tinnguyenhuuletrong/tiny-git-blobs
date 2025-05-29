import { vi, afterEach } from "vitest";

// Mock localStorage implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index]),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

// Create a mock window object if it doesn't exist
if (typeof window === "undefined") {
  (global as any).window = {};
}

// Set up global localStorage
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Clean up after each test
afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
