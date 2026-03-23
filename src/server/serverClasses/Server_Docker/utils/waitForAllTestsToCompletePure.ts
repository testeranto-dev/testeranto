import {
  WAIT_FOR_TESTS_INITIAL_DELAY,
  WAIT_FOR_TESTS_MAX_ATTEMPTS,
  WAIT_FOR_TESTS_CHECK_INTERVAL,
} from "../Server_Docker_Constants";
import { consoleLog, consoleWarn } from "../Server_Docker_Dependents";

export const waitForAllTestsToCompletePure = async (
  getProcessSummary: () => any,
): Promise<void> => {
  consoleLog("[Server_Docker] Once mode: Waiting for all tests to complete...");

  await new Promise((resolve) =>
    setTimeout(resolve, WAIT_FOR_TESTS_INITIAL_DELAY),
  );

  // We'll check periodically if all test containers have finished
  const maxAttempts = WAIT_FOR_TESTS_MAX_ATTEMPTS;
  const checkInterval = WAIT_FOR_TESTS_CHECK_INTERVAL;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const summary = getProcessSummary();

    const testContainers = summary.processes.filter((process: any) => {
      const name = process.name || "";
      return (
        name.includes("-bdd") ||
        name.includes("-check-") ||
        name.includes("-builder") ||
        name.includes("-aider")
      );
    });

    const runningContainers = testContainers.filter((process: any) => {
      const state = (process.state || "").toLowerCase();
      return (
        state === "running" || state === "restarting" || state === "created"
      );
    });

    if (runningContainers.length === 0) {
      consoleLog(
        `[Server_Docker] All ${testContainers.length} test containers have completed.`,
      );

      // Additional check: ensure all test containers have exit codes (not just stopped)
      const containersWithoutExitCode = testContainers.filter(
        (process: any) => {
          // If exitCode is null or undefined, the container might have exited abnormally
          // But we still consider it done
          return process.exitCode === null || process.exitCode === undefined;
        },
      );

      if (containersWithoutExitCode.length > 0) {
        consoleLog(
          `[Server_Docker] Note: ${containersWithoutExitCode.length} containers don't have exit codes yet`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      return;
    }

    runningContainers.forEach((container: any) => {
      consoleLog(
        `  - ${container.name || container.containerId}: state=${container.state}, status=${container.status}, exitCode=${container.exitCode}`,
      );
    });

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  consoleWarn(
    "[Server_Docker] Timeout waiting for all tests to complete. Some tests may still be running.",
  );
  consoleLog("[Server_Docker] Forcing shutdown due to timeout...");
};
