import { Server } from "./serverDeprecated/serverClasees/Server";

const mode = process.argv[2] as "once" | "dev";
if (mode !== "once" && mode !== "dev") {
  console.error(`The 3rd argument should be 'dev' or 'once', not '${mode}'.`);

  console.error(`you passed '${process.argv}'.`);

  process.exit(-1);
}

const config = (await import(process.cwd() + '/testeranto/testeranto.ts')).default;

const server = new Server(config, "dev");

server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

console.log("hello testeranto v0.222.9")