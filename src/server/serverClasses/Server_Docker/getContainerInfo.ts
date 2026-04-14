import { consoleError } from "./Server_Docker_Dependents";

// DEPRECATED: Container information should be retrieved from the graph via Server_Docker_Test.getContainerInfo()
// This standalone function is no longer supported as it bypasses the graph.
// Use the instance method on Server_Docker_Test instead.
export const getContainerInfo = (serviceName: string) => {
  consoleError(`[Server_Docker] ERROR: getContainerInfo standalone function is deprecated and should not be used.`);
  consoleError(`[Server_Docker] Container information must be retrieved from the graph via Server_Docker_Test.getContainerInfo().`);
  consoleError(`[Server_Docker] Called with serviceName: ${serviceName}`);
  
  // Throw an error to prevent silent failures
  throw new Error(
    `getContainerInfo standalone function is deprecated. ` +
    `Container information must be retrieved from the graph. ` +
    `Use Server_Docker_Test.getContainerInfo() instead.`
  );
}
