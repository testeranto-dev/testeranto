export interface ScheduleTestParams {
  runtime: string;
  testName: string;
  configKey: string;
  configValue: any;
}

export function scheduleTest(params: ScheduleTestParams): {
  runtime: string;
  testName: string;
  configKey: string;
  shouldLaunchBdd: boolean;
  shouldLaunchChecks: boolean;
} {
  return {
    runtime: params.runtime,
    testName: params.testName,
    configKey: params.configKey,
    shouldLaunchBdd: true,
    shouldLaunchChecks: true,
  };
}
