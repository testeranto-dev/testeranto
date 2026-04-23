import { acquireLock } from "../utils/lock/acquireLock";
import { isLocked } from "../utils/lock/isLocked";
import { releaseLock } from "../utils/lock/releaseLock";
import { Server_Logs } from "./Server_Logs";

/**
 * Server_Lock - Business Layer (-2)
 * 
 * Extends: Server_Logs (-2.5)
 * Extended by: Server_Static (-1)
 * Provides: Resource locking business logic
 */
export abstract class Server_Lock extends Server_Logs {
  async acquireLock(resourceId: string, ownerId: string, lockType?: 'read' | 'write' | 'exclusive'): Promise<boolean> {
    return await acquireLock(resourceId, ownerId, lockType);
  }

  async releaseLock(resourceId: string, ownerId: string): Promise<boolean> {
    return await releaseLock(resourceId, ownerId);
  }

  isLocked(resourceId: string): boolean {
    return isLocked(resourceId);
  }

  getLockOwner(resourceId: string): string | null {
    this.logBusinessMessage(`getLockOwner ${resourceId}`);
    return null;
  }

  getLockType(resourceId: string): 'read' | 'write' | 'exclusive' | null {
    this.logBusinessMessage(`getLockType ${resourceId}`);
    return null;
  }

  async releaseAllLocks(ownerId: string): Promise<number> {
    this.logBusinessMessage(`releaseAllLocks ${ownerId}`);
    return 0;
  }

  async lockAllFiles(ownerId: string): Promise<number> {
    this.logBusinessMessage(`lockAllFiles ${ownerId}`);
    return 0;
  }

  async unlockAllFiles(): Promise<number> {
    this.logBusinessMessage(`unlockAllFiles`);
    return 0;
  }

  canAccess(resourceId: string, ownerId: string, accessType: 'read' | 'write'): boolean {
    this.logBusinessMessage(`canAccess ${resourceId}, ${ownerId}, ${accessType}`);
    return true;
  }

  // Setup method called by Server.ts
  async setupLocks(): Promise<void> {
    this.logBusinessMessage("Setting up lock system...");
    // Implementation would initialize lock system
    this.logBusinessMessage("Lock system setup complete");
  }

  async cleanupLocks(): Promise<void> {
    this.logBusinessMessage("Cleaning up lock system...");
    // Implementation would clean up lock resources
    this.logBusinessMessage("Lock system cleaned up");
  }

  async notifyLocksStarted(): Promise<void> {
    this.logBusinessMessage("Lock system notified of server start");
  }

  async notifyLocksStopped(): Promise<void> {
    this.logBusinessMessage("Lock system notified of server stop");
  }
}
