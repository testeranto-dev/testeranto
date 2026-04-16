import type { ITesterantoConfig } from "../../../Types";
import { signalBuildersForOutputArtifactsUtil } from "./signalBuildersForOutputArtifactsUtil";

export async function signalBuildersForOutputArtifacts(
  configs: ITesterantoConfig,
  processCwd: string
): Promise<void> {
  signalBuildersForOutputArtifactsUtil(configs, processCwd);
  // Wait a bit for builder to process
  await new Promise(resolve => setTimeout(resolve, 1000));
}
