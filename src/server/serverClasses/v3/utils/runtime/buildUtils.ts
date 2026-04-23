import type { ITesterantoConfig } from "../../../../../Types";
import { golangBuildKitBuild } from "../../../../runtimes/golang/docker";
import { javaBuildKitBuild } from "../../../../runtimes/java/docker";
import { nodeBuildKitBuild } from "../../../../runtimes/node/docker";
import { pythonBuildKitBuild } from "../../../../runtimes/python/docker";
import { rubyBuildKitBuild } from "../../../../runtimes/ruby/docker";
import { rustBuildKitBuild } from "../../../../runtimes/rust/docker";
import { webBuildKitBuild } from "../../../../runtimes/web/docker";
// import { 
//   nodeBuildKitBuild, 
//   webBuildKitBuild, 
//   pythonBuildKitBuild, 
//   rubyBuildKitBuild, 
//   javaBuildKitBuild, 
//   golangBuildKitBuild, 
//   rustBuildKitBuild 
// } from "../../../../../runtimes";

export async function executeRuntimeBuild(
  configs: ITesterantoConfig,
  runtime: string,
  configKey: string
): Promise<void> {
  switch (runtime) {
    case 'node':
      await nodeBuildKitBuild(configs, configKey);
      break;
    case 'web':
      await webBuildKitBuild(configs, configKey);
      break;
    case 'python':
      await pythonBuildKitBuild(configs, configKey);
      break;
    case 'ruby':
      await rubyBuildKitBuild(configs, configKey);
      break;
    case 'java':
      await javaBuildKitBuild(configs, configKey);
      break;
    case 'golang':
      await golangBuildKitBuild(configs, configKey);
      break;
    case 'rust':
      await rustBuildKitBuild(configs, configKey);
      break;
    default:
      throw new Error(`Unsupported runtime: ${runtime}`);
  }
}
