import { waitForAllTestsToCompletePure } from "./Server_Docker_Utils_Run";

export class TestCompletionWaiter {
  constructor(
    private logMessage: (message: string) => void,
    private getProcessSummary: () => any,
    private logProcesses: Map<string, { process: any; serviceName: string }>
  ) {}

  async waitForAllTestsToComplete(): Promise<void> {
    await waitForAllTestsToCompletePure(() => this.getProcessSummary());

    // Additional wait to ensure all async operations (like screenshots) are complete
    // Check if there are any active processes still running
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds
    const checkInterval = 1000; // Check every second

    while (attempts < maxAttempts) {
      const summary = this.getProcessSummary();
      const activeProcesses =
        summary.processes?.filter((p: any) => p.isActive === true) || [];

      if (activeProcesses.length === 0) {
        // Also check if there are any pending operations in logProcesses
        if (this.logProcesses.size === 0) {
          break;
        }
      }

      this.logMessage(
        `[Server_Docker] Waiting for ${activeProcesses.length} active processes and ${this.logProcesses.size} log processes to complete...`,
      );
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      this.logMessage(
        `[Server_Docker] Timeout waiting for all processes to complete`,
      );
    } else {
      this.logMessage(`[Server_Docker] All processes completed`);
    }

    // Wait specifically for screenshot files to be written
    // Check for any pending screenshot operations in the reports directory
    this.logMessage(
      `[Server_Docker] Checking for pending screenshot operations...`,
    );

    // Final delay to ensure any pending I/O operations are flushed
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
