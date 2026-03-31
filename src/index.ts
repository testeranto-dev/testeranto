import pkg from "../package.json";

const version = pkg.version;

import readline from "readline";
import { Server } from "./server/serverClasses/Server";
import { join } from "path";
import fs from "fs/promises";

import stakeholderTsx from "../src/stakeholderApp/index.tsx" with { type: "text" };

const init = async () => {

  console.log("initializing the testeranto folder");

  const testerantoDir = join(process.cwd(), "testeranto");
  const bundlesDir = join(testerantoDir, "bundles");
  const reportsDir = join(testerantoDir, "reports");

  // Create directories (mkdir with recursive: true doesn't error if they exist)
  await fs.mkdir(testerantoDir, { recursive: true });
  await fs.mkdir(bundlesDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });

  // Copy stakeholder index.tsx if it doesn't exist
  const stakeholderIndexPath = join(reportsDir, "index.tsx");

  // console.log(stakeholderIndexPath, stakeholderTsx);
  await fs.writeFile(stakeholderIndexPath, stakeholderTsx);

}

const mode = process.argv[2] as "once" | "dev" | "-v" | "init";

(async () => {
  if (mode === "-v") {
    console.log(`v${version} `);
    process.exit(0);
  }

  if (mode === "init") {
    await init();
    process.exit(0);
  }

  console.log(`hello testeranto v${version} - running in ${mode} mode\n Press 'q' to initiate a graceful shutdown.\nPress 'CTRL + c' to quit forcefully.\n`);

  if (mode !== "once" && mode !== "dev" && mode != "-v") {
    console.error(`The 3rd argument should be '-v', 'init', 'dev' or 'once', not '${mode}'.`);
    console.error(`The process was given the following arguments:  '${process.argv}'.`);
    process.exit(-1);
  }

  const config = (await import(process.cwd() + '/testeranto/testeranto.ts')).default;
  const server = new Server(config, mode);

  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  process.stdin.on("keypress", async (str, key) => {
    if (key.name === "q") {
      console.log("Testeranto is shutting down gracefully...");

      await server.stop();

      process.exit(0);
    }
    // Handle Ctrl+C through keypress when in raw mode
    if (key.ctrl && key.name === "c") {
      console.log("\nForce quitting...");
      process.exit(1);
    }
  });

  process.on("SIGINT", async () => {
    console.log("\nForce quitting...");
    process.exit(1);
  });

  server.start().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });

  // In once mode, we don't need to keep the process alive indefinitely
  // The server will handle shutting down when tests are complete
  if (mode === 'once') {
    // The server will exit the process when done
    // Just keep the process alive until then
    // We'll set up a timeout to force exit after a long time (30 minutes) just in case
    const forceExitTimeout = setTimeout(() => {
      console.error('Force exiting after 30 minutes');
      process.exit(1);
    }, 30 * 60 * 1000);

    // Clear the timeout if the process exits normally
    process.on('exit', () => {
      clearTimeout(forceExitTimeout);
    });
  }

  // TEMPORARY BUT DO NOT DELETE 
  // top level unhandled promise rejections to prevent crashes
  /////////////////////////////////////////////////////////////////////////////////
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process
  });
  process.on('uncaughtException', (error) => {
    console.error('[Server] Uncaught Exception:', error);
    // Don't exit the process
  });
  /////////////////////////////////////////////////////////////////////////////////
})();
