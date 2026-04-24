export interface InformAiderParams {
  runtime: string;
  testName: string;
  configKey: string;
  configValue: any;
  serviceName: string;
  files?: any;
}

export function informAider(params: InformAiderParams): {
  serviceName: string;
  messageFilePath: string;
} {
  return {
    serviceName: params.serviceName,
    messageFilePath: `testeranto/reports/${params.configKey}/${params.testName}/aider-message.txt`,
  };
}
