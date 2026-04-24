import path from 'path';

export interface CreateAiderMessageFileParams {
  configKey: string;
  testName: string;
  inputFiles: string[];
  checksCount: number;
  projectRoot: string;
}

export function createAiderMessageFile(params: CreateAiderMessageFileParams): {
  messageFilePath: string;
  messageContent: string;
} {
  const reportDir = `${params.projectRoot}/testeranto/reports/${params.configKey}/${params.testName}`;
  const messageFilePath = `${reportDir}/aider-message.txt`;

  let messageContent = '';

  // Include all input files, but exclude aider-message.txt to avoid circular reference
  const filteredInputFiles = params.inputFiles.filter(file => !file.includes('aider-message.txt'));

  if (filteredInputFiles.length > 0) {
    messageContent +=
      filteredInputFiles.map((file) => {
        const relativePath = path.relative(params.projectRoot, file);
        return `/add ${relativePath}`;
      }).join('\n') + '\n\n';
  }

  // Get test-specific output files
  const parentReportDir = path.dirname(reportDir);

  // Transform the test file name to match the log file naming pattern
  const testFileName = path.basename(params.testName);
  const cleanTestName = testFileName
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Always look for bdd log
  const bddLogPath = path.join(parentReportDir, `${cleanTestName}_bdd.log`);
  messageContent += `/read ${path.relative(params.projectRoot, bddLogPath)}\n`;

  // Look for check logs based on checks count
  for (let i = 0; i < params.checksCount; i++) {
    const checkLogPath = path.join(parentReportDir, `${cleanTestName}_check-${i}.log`);
    messageContent += `/read ${path.relative(params.projectRoot, checkLogPath)}\n`;
  }

  // Add the tests.json file from the test-specific directory
  const testsJsonPath = path.join(reportDir, 'tests.json');
  messageContent += `/read ${path.relative(params.projectRoot, testsJsonPath)}\n`;

  if (messageContent.includes('/read')) {
    messageContent += '\n';
  }

  messageContent += 'Observe these reports and apply. Fix any failing tests, and if that is done, cleanup this code.\n\n';

  return {
    messageFilePath,
    messageContent,
  };
}
