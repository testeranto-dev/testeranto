// This file concerns resource locking

import type { ITesterantoConfig } from "../../Types";
import type { IMode } from "../types";
import { Server_Vscode } from "./Server_Vscode";

export class Server_Lock extends Server_Vscode {
  constructor(configs: ITesterantoConfig, mode: IMode) {
    super(configs, mode);
  }

  /**
   * Acquire a lock on a file node
   * @param nodeId The ID of the node to lock
   * @param ownerId The ID of the agent/test acquiring the lock
   * @param lockType Type of lock (read/write/exclusive)
   * @returns boolean indicating if lock was acquired
   */
  acquireLock(nodeId: string, ownerId: string, lockType: 'read' | 'write' | 'exclusive' = 'exclusive'): boolean {
    if (!this.graph.hasNode(nodeId)) {
      return false;
    }

    const attrs = this.graph.getNodeAttributes(nodeId);

    // Check if node is already locked
    if (attrs.locked) {
      // For read locks, multiple readers are allowed
      if (lockType === 'read' && attrs.lockType === 'read') {
        // Allow multiple read locks
        this.graph.mergeNodeAttributes(nodeId, {
          locked: true,
          lockOwner: ownerId,
          lockTimestamp: new Date().toISOString(),
          lockType: 'read'
        });
        return true;
      }
      // For write/exclusive locks, node must be unlocked
      return false;
    }

    // Acquire the lock
    this.graph.mergeNodeAttributes(nodeId, {
      locked: true,
      lockOwner: ownerId,
      lockTimestamp: new Date().toISOString(),
      lockType
    });

    return true;
  }

  /**
   * Release a lock on a file node
   * @param nodeId The ID of the node to unlock
   * @param ownerId The ID of the agent/test releasing the lock
   * @returns boolean indicating if lock was released
   */
  releaseLock(nodeId: string, ownerId: string): boolean {
    if (!this.graph.hasNode(nodeId)) {
      return false;
    }

    const attrs = this.graph.getNodeAttributes(nodeId);

    // Check if node is locked by this owner
    if (!attrs.locked || attrs.lockOwner !== ownerId) {
      return false;
    }

    // Release the lock
    this.graph.mergeNodeAttributes(nodeId, {
      locked: false,
      lockOwner: undefined,
      lockTimestamp: undefined,
      lockType: undefined
    });

    return true;
  }

  /**
   * Check if a file is locked
   * @param nodeId The ID of the node to check
   * @returns boolean indicating if node is locked
   */
  isLocked(nodeId: string): boolean {
    if (!this.graph.hasNode(nodeId)) {
      return false;
    }
    const attrs = this.graph.getNodeAttributes(nodeId);
    return attrs.locked === true;
  }

  /**
   * Get lock owner for a node
   * @param nodeId The ID of the node
   * @returns The lock owner ID or undefined
   */
  getLockOwner(nodeId: string): string | undefined {
    if (!this.graph.hasNode(nodeId)) {
      return undefined;
    }
    const attrs = this.graph.getNodeAttributes(nodeId);
    return attrs.lockOwner;
  }

  /**
   * Release all locks for an owner
   * @param ownerId The ID of the owner
   * @returns Number of locks released
   */
  releaseAllLocks(ownerId: string): number {
    let releasedCount = 0;

    this.graph.forEachNode((nodeId) => {
      const attrs = this.graph.getNodeAttributes(nodeId);
      if (attrs.locked && attrs.lockOwner === ownerId) {
        this.graph.mergeNodeAttributes(nodeId, {
          locked: false,
          lockOwner: undefined,
          lockTimestamp: undefined,
          lockType: undefined
        });
        releasedCount++;
      }
    });

    return releasedCount;
  }

  /**
   * Lock all file nodes (for restart mode)
   * @param ownerId The ID of the owner (e.g., 'system:restart')
   * @returns Number of files locked
   */
  lockAllFiles(ownerId: string = 'system:restart'): number {
    let lockedCount = 0;

    this.graph.forEachNode((nodeId) => {
      const attrs = this.graph.getNodeAttributes(nodeId);
      // Lock file nodes (file, input_file, entrypoint, test)
      if (attrs.type === 'file' || attrs.type === 'input_file' ||
        attrs.type === 'entrypoint' || attrs.type === 'test') {
        if (!attrs.locked) {
          this.graph.mergeNodeAttributes(nodeId, {
            locked: true,
            lockOwner: ownerId,
            lockTimestamp: new Date().toISOString(),
            lockType: 'exclusive'
          });
          lockedCount++;
        }
      }
    });

    return lockedCount;
  }

  /**
   * Unlock all file nodes
   * @returns Number of files unlocked
   */
  unlockAllFiles(): number {
    let unlockedCount = 0;

    this.graph.forEachNode((nodeId) => {
      const attrs = this.graph.getNodeAttributes(nodeId);
      // Unlock file nodes (file, input_file, entrypoint, test)
      if (attrs.type === 'file' || attrs.type === 'input_file' ||
        attrs.type === 'entrypoint' || attrs.type === 'test') {
        if (attrs.locked) {
          this.graph.mergeNodeAttributes(nodeId, {
            locked: false,
            lockOwner: undefined,
            lockTimestamp: undefined,
            lockType: undefined
          });
          unlockedCount++;
        }
      }
    });

    return unlockedCount;
  }

  /**
   * Check if any file is locked
   * @returns boolean indicating if any file is locked
   */
  hasLockedFiles(): boolean {
    let hasLocked = false;
    return false;
    // this.graph.forEachNode((nodeId) => {
    //   const attrs = this.graph.getNodeAttributes(nodeId);
    //   if (attrs.locked && (attrs.type === 'file' || attrs.type === 'input_file' || 
    //       attrs.type === 'entrypoint' || attrs.type === 'test')) {
    //     hasLocked = true;
    //   }
    // });

    // return hasLocked;
  }

  /**
   * Get all locked files
   * @returns Array of locked file node IDs
   */
  getLockedFiles(): string[] {
    const lockedFiles: string[] = [];

    this.graph.forEachNode((nodeId) => {
      const attrs = this.graph.getNodeAttributes(nodeId);
      if (attrs.locked && (attrs.type === 'file' || attrs.type === 'input_file' ||
        attrs.type === 'entrypoint' || attrs.type === 'test')) {
        lockedFiles.push(nodeId);
      }
    });

    return lockedFiles;
  }

  /**
   * Check if a file can be accessed by an owner
   * @param nodeId The ID of the node to check
   * @param ownerId The ID of the agent/test trying to access
   * @param accessType Type of access needed (read/write)
   * @returns boolean indicating if access is allowed
   */
  canAccess(nodeId: string, ownerId: string, accessType: 'read' | 'write' = 'write'): boolean {
    if (!this.graph.hasNode(nodeId)) {
      return false;
    }

    const attrs = this.graph.getNodeAttributes(nodeId);

    // If not locked, access is allowed
    if (!attrs.locked) {
      return true;
    }

    // If locked by the same owner, access is allowed
    if (attrs.lockOwner === ownerId) {
      return true;
    }

    // For read access, if lock is read type, allow multiple readers
    if (accessType === 'read' && attrs.lockType === 'read') {
      return true;
    }

    // Otherwise, access is denied
    return false;
  }
}
