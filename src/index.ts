// TODO auto add correct version instead of hardcode

import readline from "readline";
import { Server } from "./server/serverClasses/Server";

const mode = process.argv[2] as "once" | "dev" | "-v";

if (mode === "-v") {
  console.log(`v${"0.233.7"} `)
  process.exit(0);
}

console.log(`hello testeranto v0.233.7 - running in ${mode} mode\n Press 'q' to initiate a graceful shutdown.\nPress 'CTRL + c' to quit forcefully.\n`);

if (mode !== "once" && mode !== "dev" && mode != "-v") {
  console.error(`The 3rd argument should be 'dev' or 'once', not '${mode}'.`);
  console.error(`The process was given the folowring arguments:  '${process.argv}'.`);
  process.exit(-1);
} else {

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
