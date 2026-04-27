// export const generateBuilderService = (
//   configKey: string,
//   configValue: any,
//   mode: string,
// ): any => {
//   return {
//     container_name: `${configKey}-builder`,
//     environment: {
//       NODE_ENV: 'production',
//       ENV: configValue.runtime || 'node',
//       MODE: mode,
//     },
//     working_dir: '/workspace',
//     volumes: [
//       `${process.cwd()}/src:/workspace/src`,
//       `${process.cwd()}/dist:/workspace/dist`,
//       `${process.cwd()}/testeranto:/workspace/testeranto`,
//     ],
//     command: `yarn tsx /workspace/testeranto/node_runtime.ts /workspace/testeranto/testeranto.ts /workspace/testeranto/runtimes/node/node.mjs '{"name":"${configKey}","tests":${JSON.stringify(configValue.tests || [])},"outputs":[]}'`,
//     networks: ['allTests_network'],
//     restart: 'no',
//     image: `testeranto-${configValue.runtime || 'node'}-${configKey}:latest`,
//     extra_hosts: {
//       'host.docker.internal': 'host-gateway',
//     },
//   };
// };
