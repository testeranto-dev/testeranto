import type { ITesterantoConfig } from "../../../../../Types";

export function getRuntimeDockerfilePath(
  configs: ITesterantoConfig,
  runtime: string
): string {
  const runtimeConfig = Object.values(configs.runtimes).find(
    (config: any) => config.runtime === runtime
  );
  if (!runtimeConfig?.dockerfile) {
    throw new Error(`No dockerfile configured for runtime: ${runtime}`);
  }
  return runtimeConfig.dockerfile;
}

export function getRuntimeVolumes(runtime: string): string[] {
  const baseVolumes = [
    `${process.cwd()}/src:/workspace/src`,
    `${process.cwd()}/test:/workspace/test`,
    `${process.cwd()}/SOUL.md:/workspace/SOUL.md`,
    `${process.cwd()}/testeranto:/workspace/testeranto`
  ];

  switch (runtime) {
    case 'node':
    case 'web':
      return [...baseVolumes, `${process.cwd()}/dist:/workspace/dist`];
    case 'java':
      return [...baseVolumes, `${process.cwd()}/lib:/workspace/lib`];
    default:
      return baseVolumes;
  }
}
