import type { ITestconfigV2 } from "../../../Types";
import { dockerComposeFile } from "../dockerComposeFile";

export const javaockerComposeFile = (
  config: ITestconfigV2,
  container_name: string,
  projectConfigPath: string,
  nodeConfigPath: string,
  testName: string
) => {
  return dockerComposeFile(
    config,
    container_name,
    projectConfigPath,
    nodeConfigPath,
    testName,
    javaBuildCommand
  )
};


export const javaBuildCommand = (fpath: string) => {
  return `java src/server/runtimes/java/java.java /workspace/${fpath}`;
}

export const javaBddCommand = (fpath: string) => {
  return `java testeranto/bundles/java/${fpath} /workspace/java.java`;
}



// export const javaBuildCommand = () => {
//   return "cd /workspace && javac -cp \".:lib/*\" src/server/runtimes/java/main.java && java -cp \"src/server/runtimes/java:.\" main";
// }

// // this image "builds" test bundles. it is not a "docker build" thing
// export const javaBddCommand = () => {
//   const jsonStr = JSON.stringify({ ports: [1111] });
//   return `java -jar testeranto/bundles/allTests/java/example/Calculator-test.jar '${jsonStr}'`
// }

// export const javaTestCommand = (config: IBuiltConfig, inputfiles: string[]) => {
//   return `
// ${config.java.checks?.map((c) => {
//     return c(inputfiles);
//   }).join('\n') || ''}

//     ${javaBddCommand()}
//   `;
// }
