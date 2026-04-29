import type { TesterantoGraph, GraphNodeAttributes, GraphEdgeAttributes } from "../../../../../graph";
import { collectInputFiles, collectOutputFiles } from "./collectTestFiles";

export async function writeCompletionMarker(
  joinPaths: (...paths: string[]) => string,
  writeFile: (path: string, content: string) => Promise<void>,
  logBusinessMessage: (msg: string) => void,
  graph: TesterantoGraph<GraphNodeAttributes, GraphEdgeAttributes>,
  configKey: string,
  testName: string,
  testResult: any,
  projectRoot: string,
): Promise<void> {
  const testNodeId = `test:${configKey}:${testName}`;
  const inputFiles = collectInputFiles(graph, testNodeId);
  const outputFiles = collectOutputFiles(graph, testNodeId);

  const readYaml = inputFiles.map(f => `  - ${f}`).join('\n');
  const addYaml = outputFiles.map(f => `  - ${f}`).join('\n');

  const testPassed = testResult?.passed ?? false;
  const resultSummary = testPassed ? 'passed' : 'failed';

  const personaBody = `You are an agent that needs to review the test results for ${testName} (${configKey}).

The test ${resultSummary}.

Based on the test results, you need to make changes to the output files listed below.
Review the input files to understand the expected behavior, then modify the output files accordingly.

Input files (read-only):
${inputFiles.map(f => `- ${f}`).join('\n')}

Output files (read-write):
${outputFiles.map(f => `- ${f}`).join('\n')}

Test result details:
${JSON.stringify(testResult, null, 2)}
`;

  const completionData = `---
read:
${readYaml}
add:
${addYaml}
---

${personaBody}
`;

  const completionFilePath = joinPaths(
    projectRoot,
    "testeranto",
    "reports",
    configKey,
    testName,
    "test-completed.md"
  );

  await writeFile(completionFilePath, completionData);
  logBusinessMessage(`Test completion marker written to ${completionFilePath}`);
}
