import fs from 'fs';

export function signalBuildersForOutputArtifactsUtil(
  configs: any,
  processCwd: () => string
): void {
  // For each runtime config with outputs, signal its builder
  for (const [configKey, config] of Object.entries(configs.runtimes)) {
    const outputs = config.outputs;
    if (!outputs || outputs.length === 0) continue;

    console.log(`[DockerOutput] Signaling builder for ${configKey} to produce output artifacts`);

    // Find the builder service name
    const builderServiceName = `${configKey}-builder`;

    // Send signal to builder container
    // We can create a trigger file that the builder watches for
    const triggerPath = `${processCwd()}/testeranto/build-output-trigger-${configKey}`;
    fs.writeFileSync(triggerPath, JSON.stringify({ outputs }));

    console.log(`[DockerOutput] Created trigger file at ${triggerPath}`);

    // Wait a bit for builder to process
    // Note: This is synchronous in the original code
  }
}
