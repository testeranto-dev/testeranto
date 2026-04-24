import { watchFile, unwatchFile } from "fs";
import type { UnifiedFileWatcherOptions } from "../unifiedFileWatcher";

export interface WatcherManagerState {
  watchers: Map<string, () => void>;
  timeoutIds: Map<string, NodeJS.Timeout>;
}

export function setupFileWatcher(
  filePath: string,
  handler: () => void,
  state: WatcherManagerState,
  options: UnifiedFileWatcherOptions
): () => void {
  const { consoleLog, consoleError } = options;

  try {
    watchFile(filePath, { persistent: false }, handler);

    const unwatch = () => {
      const key = Object.keys(state.timeoutIds).find(k => state.timeoutIds.get(k));
      const timeoutId = key ? state.timeoutIds.get(key) : undefined;
      if (timeoutId) {
        clearTimeout(timeoutId);
        state.timeoutIds.delete(key!);
      }
      try {
        unwatchFile(filePath, handler);
      } catch (error) {
        consoleError(`[WatcherManager] Error unwatching file:`, error);
      }
    };

    state.watchers.set(filePath, unwatch);
    consoleLog(`[WatcherManager] Now watching file: ${filePath}`);
    return unwatch;
  } catch (error) {
    consoleError(`[WatcherManager] Failed to watch file ${filePath}:`, error);
    return () => {};
  }
}

export function stopAllWatchers(
  state: WatcherManagerState,
  options: UnifiedFileWatcherOptions
): void {
  const { consoleLog, consoleError } = options;

  // Clear all timeouts
  for (const timeoutId of state.timeoutIds.values()) {
    clearTimeout(timeoutId);
  }
  state.timeoutIds.clear();

  // Stop all watchers
  for (const [filePath, unwatch] of state.watchers.entries()) {
    try {
      unwatch();
      consoleLog(`[WatcherManager] Stopped watching ${filePath}`);
    } catch (error) {
      consoleError(`[WatcherManager] Error stopping watcher for ${filePath}:`, error);
    }
  }
  state.watchers.clear();
}
