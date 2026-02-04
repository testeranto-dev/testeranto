import { Server } from "./serverDeprecated/serverClasees/Server";
import { ITestconfigV2 } from "./Types";

// Create a sample configuration
const config: ITestconfigV2 = {
  featureIngestor: async (s: string) => {
    console.log("Feature ingestor called with:", s);
    return "processed";
  },
  runtimes: {
    // Add your runtime configurations here
  }
};

// Create and start the server
const server = new Server(config, "dev");

server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

console.log("Testeranto server starting with Bun...");
