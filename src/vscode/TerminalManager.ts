import * as vscode from 'vscode';
import type { IRunTime } from '../Types';

export class TerminalManager {
  private terminals: Map<string, vscode.Terminal> = new Map();

  getTerminalKey(runtime: string, testName: string): string {
    return `${runtime}:${testName}`;
  }

  createTerminal(runtime: string, testName: string): vscode.Terminal {
    const key = this.getTerminalKey(runtime, testName);
    const terminal = vscode.window.createTerminal(`Testeranto: ${testName} (${runtime})`);
    this.terminals.set(key, terminal);
    return terminal;
  }

  getTerminal(runtime: string, testName: string): vscode.Terminal | undefined {
    const key = this.getTerminalKey(runtime, testName);
    return this.terminals.get(key);
  }

  showTerminal(runtime: string, testName: string): vscode.Terminal | undefined {
    const terminal = this.getTerminal(runtime, testName);
    if (terminal) {
      terminal.show();
    }
    return terminal;
  }

  sendTextToTerminal(runtime: string, testName: string, text: string): void {
    const terminal = this.getTerminal(runtime, testName);
    if (terminal) {
      terminal.sendText(text);
    }
  }

  disposeTerminal(runtime: string, testName: string): void {
    const key = this.getTerminalKey(runtime, testName);
    const terminal = this.terminals.get(key);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(key);
    }
  }

  disposeAll(): void {
    for (const terminal of this.terminals.values()) {
      terminal.dispose();
    }
    this.terminals.clear();
  }

  // Fetch aider processes from the server
  async fetchAiderProcesses(): Promise<any[]> {
    try {
      const response = await fetch('http://localhost:3000/~/aider-processes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.aiderProcesses || [];
    } catch (error) {
      console.error('Failed to fetch aider processes:', error);
      return [];
    }
  }

  // Create terminals for all aider processes (but don't automatically start them)
  async createAiderTerminals(): Promise<void> {
    try {
      const aiderProcesses = await this.fetchAiderProcesses();
      console.log(`Found ${aiderProcesses.length} aider processes`);

      // Don't automatically create terminals for aider processes
      // Aider needs user interaction, so we'll only create terminals on demand
      // Just log the available aider processes
      for (const process of aiderProcesses) {
        console.log(`Aider process available: ${process.testName} (${process.runtime}) - ${process.isActive ? 'running' : 'stopped'}`);
      }
    } catch (error) {
      console.error('Failed to fetch aider processes:', error);
    }
  }

  async createAiderTerminal(runtimeKey: string | string | any, testName: string | any): Promise<vscode.Terminal> {
    // Helper function to extract string value from various input types
    const extractString = (value: any, isRuntime: boolean = false): string => {
      if (typeof value === 'string') {
        return value;
      }
      if (value && typeof value === 'object') {
        // Try to extract from common object structures
        if (isRuntime) {
          // For runtime, try to get from data.runtime or just the value
          return value.runtimeKey || value.data?.runtimeKey || value.label || value.name || String(value);
        } else {
          // For testName, try various property names
          return value.testName || value.data?.testName || value.label || value.name || String(value);
        }
      }
      return String(value || 'unknown');
    };

    // Extract string values
    const runtimeStr = runtimeKey; //extractString(runtime, true);
    const testNameStr = extractString(testName, false);

    // createAiderTerminal called with runtime: "node", testName: "src/ts/Calculator.test.ts"
    console.log(`[TerminalManager] createAiderTerminal called with runtime: "${runtimeStr}", testName: "${testNameStr}"`);
    console.log(`[TerminalManager] Original runtime:`, runtimeKey);
    console.log(`[TerminalManager] Original testName:`, testName);

    const key = this.getTerminalKey(runtimeStr, testNameStr);
    let terminal = this.terminals.get(key);

    // If terminal exists and is still running, just show it
    if (terminal && terminal.exitStatus === undefined) {
      terminal.show();
      return terminal;
    }

    // Create a new terminal
    terminal = vscode.window.createTerminal(`Aider: ${testNameStr} (${runtimeStr})`);
    this.terminals.set(key, terminal);

    // await this.spawnPromise(`docker compose -f "testeranto/docker-compose.yml" up -d ${aiderServiceName}`);

    terminal.sendText(`cd Code/testeranto-example-project`)
    const tname = `nodetests-src_ts_calculator-test-ts-aider`
    terminal.sendText(`docker compose -f "testeranto/docker-compose.yml" run -it ${tname} aider`);

    // // First, we need to find the aider container
    // const aiderProcesses = await this.fetchAiderProcesses();
    // console.log(`[TerminalManager] Found ${aiderProcesses.length} aider processes`);

    // // Try to find the process - be more flexible in matching
    // let process = aiderProcesses.find(p =>
    //   p.runtime === runtimeStr && p.testName === testNameStr
    // );

    // // If not found by exact match, try to find by partial match
    // if (!process) {
    //   process = aiderProcesses.find(p => {
    //     // Check if testName matches partially (e.g., "Calculator.test.ts" vs "Calculator.test")
    //     const cleanTestName1 = testNameStr.replace(/\.[^/.]+$/, "");
    //     const cleanTestName2 = p.testName?.replace(/\.[^/.]+$/, "");
    //     return p.runtime === runtimeStr && cleanTestName1 === cleanTestName2;
    //   });
    // }

    // // If still not found, try to find by container name pattern
    // if (!process) {
    //   // Generate the expected container name pattern
    //   const cleanTestName = testNameStr ? testNameStr.toLowerCase()
    //     .replaceAll("/", "_")
    //     .replaceAll(".", "-")
    //     .replace(/[^a-z0-9_-]/g, '') : '';

    //   // Try to find a config key - we need to guess based on runtime
    //   // For node runtime, config key is often "nodeTests"
    //   const configKey = runtimeStr === 'node' ? 'nodeTests' :
    //     runtimeStr === 'web' ? 'webTests' :
    //       runtimeStr === 'python' ? 'pythonTests' :
    //         runtimeStr === 'golang' ? 'golangTests' :
    //           runtimeStr === 'ruby' ? 'rubyTests' :
    //             runtimeStr === 'rust' ? 'rustTests' :
    //               runtimeStr === 'java' ? 'javaTests' :
    //                 `${runtimeStr}Tests`;

    //   const expectedContainerName = `${configKey.toLowerCase()}-${cleanTestName}-aider`;

    //   process = aiderProcesses.find(p =>
    //     p.containerName && p.containerName.includes(expectedContainerName)
    //   );
    // }

    // if (process) {
    //   console.log(`[TerminalManager] Found aider process:`, process);
    //   // Container exists in docker-compose
    //   const serviceName = process.containerName || process.name;
    //   const containerId = process.containerId;

    //   // terminal.sendText(`clear`);
    //   terminal.sendText(`echo "Connecting to aider for ${testNameStr} (${runtimeStr})..."`);

    //   // Start the service if not running
    //   if (!process.isActive) {
    //     terminal.sendText(`echo "Starting aider container ${serviceName}..."`);
    //     terminal.sendText(`docker compose -f "testeranto/docker-compose.yml" up -d ${serviceName}`);
    //     // terminal.sendText(`sleep 3`);
    //   }

    //   // Run aider in the container
    //   terminal.sendText(`echo "Starting aider session in container ${serviceName}..."`);

    //   // First, check if container is running
    //   terminal.sendText(`docker ps | grep ${containerId || serviceName} || echo "Container not found in running containers"`);

    //   // Try to exec into the container with aider
    //   if (containerId) {
    //     terminal.sendText(`docker exec -it ${containerId} aider`);
    //   } else {
    //     terminal.sendText(`docker exec -it ${serviceName} aider`);
    //   }
    // } else {
    //   console.log(`[TerminalManager] No aider process found for ${runtimeStr}/${testNameStr}`);
    //   console.log(`[TerminalManager] Available aider processes:`, aiderProcesses.map(p => ({
    //     runtime: p.runtime,
    //     testName: p.testName,
    //     containerName: p.containerName,
    //     isActive: p.isActive
    //   })));

    //   // First, check if the server is running by looking for the docker-compose.yml file
    //   // terminal.sendText(`clear`);
    //   // terminal.sendText(`echo "Checking if Testeranto server is running..."`);
    //   // terminal.sendText(`if [ -f "testeranto/docker-compose.yml" ]; then`);
    //   // terminal.sendText(`  echo "✓ docker-compose.yml found"`);
    //   // terminal.sendText(`  echo ""`);
    //   // terminal.sendText(`  echo "Attempting to start aider for ${testNameStr} (${runtimeStr})..."`);
    //   // terminal.sendText(`  echo ""`);

    //   // // Generate the service name based on the pattern used in Server_Docker.ts
    //   // const cleanTestName = testNameStr ? testNameStr.toLowerCase()
    //   //   .replaceAll("/", "_")
    //   //   .replaceAll(".", "-")
    //   //   .replace(/[^a-z0-9_-]/g, '') : '';

    //   // // Try different possible config keys
    //   // const possibleConfigKeys = [
    //   //   `${runtimeStr}Tests`,
    //   //   `${runtimeStr.toLowerCase()}Tests`,
    //   //   `${runtimeStr}`
    //   // ];

    //   // for (const configKey of possibleConfigKeys) {
    //   //   const serviceName = `${configKey.toLowerCase()}-${cleanTestName}-aider`;
    //   //   terminal.sendText(`  echo "Checking service: ${serviceName}"`);
    //   //   terminal.sendText(`  docker compose -f "testeranto/docker-compose.yml" ps ${serviceName} 2>/dev/null | grep -q "${serviceName}" && echo "  ✓ Service exists" || echo "  ✗ Service not found"`);
    //   // }

    //   // terminal.sendText(`  echo ""`);
    //   // terminal.sendText(`  echo "If the service exists, you can start it with:"`);
    //   // terminal.sendText(`  echo "  docker compose -f \\"testeranto/docker-compose.yml\\" up -d <service-name>"`);
    //   // terminal.sendText(`  echo "Then connect with:"`);
    //   // terminal.sendText(`  echo "  docker exec -it <container-name> aider"`);
    //   // terminal.sendText(`  echo ""`);
    //   // terminal.sendText(`  echo "To see all available services:"`);
    //   // terminal.sendText(`  echo "  docker compose -f \\"testeranto/docker-compose.yml\\" config --services"`);
    //   // terminal.sendText(`else`);
    //   // terminal.sendText(`  echo "✗ docker-compose.yml not found"`);
    //   // terminal.sendText(`  echo ""`);
    //   // terminal.sendText(`  echo "The Testeranto server needs to be running to generate docker-compose.yml."`);
    //   // terminal.sendText(`  echo "Please start the server first:"`);
    //   // terminal.sendText(`  echo "  1. Run 'npm start' in your project root"`);
    //   // terminal.sendText(`  echo "  2. Or click the 'Start Server' button in the Testeranto status bar"`);
    //   // terminal.sendText(`  echo ""`);
    //   // terminal.sendText(`  echo "Once the server is running, try connecting to aider again."`);
    //   // terminal.sendText(`fi`);
    // }

    terminal.show();
    return terminal;
  }

  // Restart a specific aider process
  async restartAiderProcess(runtime: string, testName: string): Promise<void> {
    try {
      const aiderProcesses = await this.fetchAiderProcesses();
      const process = aiderProcesses.find(p =>
        p.runtime === runtime && p.testName === testName
      );

      if (process) {
        const key = this.getTerminalKey(runtime, testName);
        let terminal = this.terminals.get(key);

        if (!terminal || terminal.exitStatus !== undefined) {
          terminal = vscode.window.createTerminal(`Aider: ${testName} (${runtime})`);
          this.terminals.set(key, terminal);
        }

        // Restart the container
        terminal.sendText(`docker restart ${process.containerId}`);
        // Wait a bit and then connect
        terminal.sendText(`sleep 2 && docker exec -it ${process.containerId} /bin/bash`);
        terminal.show();
      } else {
        vscode.window.showErrorMessage(`No aider process found for ${testName} (${runtime})`);
      }
    } catch (error) {
      console.error('Failed to restart aider process:', error);
      vscode.window.showErrorMessage(`Failed to restart aider process: ${error}`);
    }
  }

  createAllTerminals(): void {
    // Create terminals for all aider processes
    this.createAiderTerminals().catch(error => {
      console.error('Error in createAllTerminals:', error);
    });
  }
}
