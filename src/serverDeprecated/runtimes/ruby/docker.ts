import { ITestconfigV2 } from "../../../Types";

export const rubyDockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  rubyConfigPath: string,
  testName: string
) => {
  return {
    build: {
      context: process.cwd(),
      dockerfile: config[container_name].dockerfile,
    },
    container_name,
    environment: {
      NODE_ENV: "production",

      ...config.env,
    },
    working_dir: "/workspace",
    volumes: [
      `${process.cwd()}/src:/workspace/src`,
      `${process.cwd()}/example:/workspace/example`,
      `${process.cwd()}/dist:/workspace/dist`,
      `${process.cwd()}/../../testeranto:/workspace/testeranto`,
    ],
    command: rubyBuildCommand(projectConfigPath, rubyConfigPath, testName),
  }
};

export const rubyBuildCommand = (projectConfigPath: string, rubyConfigPath: string, testName: string) => {
  // The testeranto source is mounted at /workspace/testeranto
  // return `ruby node_modules/testeranto/dist/ruby/ruby.rb /workspace/${rubyConfigPath} ${testName}`;
  return 'tree /workspace/node_modules/testeranto/dist'
}

export const rubyBddCommand = (fpath: string) => {

  // return `bundle exec rubeno /workspace/testeranto/testeranto.ts /workspace/${rubyConfigPath} ${testName}`;

  // const jsonStr = JSON.stringify({ ports: [1111] });
  // return `ruby example/Calculator-test.rb '${jsonStr}'`;
  const jsonStr = JSON.stringify({ ports: [1111] });
  return `ruby ${fpath} '${jsonStr}'`;
}
