import { Server } from "./server/serverClasses/Server";

const mode = process.argv[2] as "once" | "dev" | "-v";
if (mode !== "once" && mode !== "dev" && mode != "-v") {
  console.error(`The 3rd argument should be 'dev' or 'once', not '${mode}'.`);

  console.error(`you passed '${process.argv}'.`);

  process.exit(-1);
}

if (mode === "-v") {
  console.log(`v${"0.225.2"} `)
  process.exit(0);
}

const config = (await import(process.cwd() + '/testeranto/testeranto.ts')).default;

const server = new Server(config, mode);

server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

console.log(`hello testeranto v0.224.4 - running in ${mode} mode`);

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
