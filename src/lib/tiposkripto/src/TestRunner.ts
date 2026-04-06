import { ITestJob, ITestResourceConfiguration, IFinalResults } from "./types";

export class TestRunner {
  static async runAllTests(
    testJobs: ITestJob[],
    totalTests: number,
    testResourceConfiguration: ITestResourceConfiguration,
    writeFileSync: (filename: string, payload: string) => void
  ): Promise<void> {
    const allResults = [];
    let totalFails = 0;
    let anyFailed = false;
    const allFeatures: string[] = [];
    const allArtifacts: any[] = [];

    for (let i = 0; i < testJobs.length; i++) {
      try {
        const result = await testJobs[i].receiveTestResourceConfig(testResourceConfiguration);
        allResults.push(result);
        totalFails += result.fails;
        anyFailed = anyFailed || result.failed;

        if (result.features && Array.isArray(result.features)) {
          allFeatures.push(...result.features);
        }
        if (result.artifacts && Array.isArray(result.artifacts)) {
          allArtifacts.push(...result.artifacts);
        }
      } catch (e) {
        console.error(`Error running test job ${i}:`, e);
        totalFails++;
        anyFailed = true;
        allResults.push({
          failed: true,
          fails: 1,
          features: [],
          artifacts: [],
          error: {
            message: (e as Error).message,
            stack: (e as Error).stack,
            name: (e as Error).name
          },
          stepName: `Job_${i}`,
          stepType: 'Error',
          testJob: { name: `Job_${i}_Error` }
        });
      }
    }

    const combinedResults: any = {
      failed: anyFailed,
      fails: totalFails,
      artifacts: allArtifacts,
      features: [...new Set(allFeatures)],
      tests: testJobs.length,
      runTimeTests: totalTests,
      testJob: { name: 'CombinedResults' },
      timestamp: Date.now(),
      individualResults: allResults.map((result, idx) => ({
        index: idx,
        failed: result.failed,
        fails: result.fails,
        features: result.features || [],
        error: result.error,
        stepName: result.stepName,
        stepType: result.stepType,
        testJob: result.testJob
      }))
    };

    combinedResults.summary = {
      totalTests: testJobs.length,
      passed: testJobs.length - totalFails,
      failed: totalFails,
      successRate: totalFails === 0 ? '100%' :
        ((testJobs.length - totalFails) / testJobs.length * 100).toFixed(2) + '%'
    };

    console.log("testResourceConfiguration", testResourceConfiguration);
    const reportJson = `${testResourceConfiguration.fs}/tests.json`;
    writeFileSync(reportJson, JSON.stringify(combinedResults, null, 2));
  }

  static writeEmptyResults(
    testResourceConfiguration: ITestResourceConfiguration,
    writeFileSync: (filename: string, payload: string) => void
  ): void {
    const emptyResults = {
      failed: true,
      fails: -1,
      artifacts: [],
      features: [],
      tests: 0,
      runTimeTests: -1,
      testJob: {},
      timestamp: Date.now(),
      error: {
        message: "No test jobs were created",
        name: "ConfigurationError"
      },
      individualResults: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 1,
        successRate: '0%'
      }
    };
    const reportJson = `${testResourceConfiguration.fs}/tests.json`;
    writeFileSync(reportJson, JSON.stringify(emptyResults, null, 2));
  }

  static async runAllTestsAndReturnResults(
    testJobs: ITestJob[],
    totalTests: number,
    testResourceConfig: ITestResourceConfiguration
  ): Promise<any> {
    const allResults = [];
    let totalFails = 0;
    let anyFailed = false;
    const allFeatures: string[] = [];
    const allArtifacts: any[] = [];

    for (let i = 0; i < testJobs.length; i++) {
      try {
        const result = await testJobs[i].receiveTestResourceConfig(testResourceConfig);
        allResults.push(result);
        totalFails += result.fails;
        anyFailed = anyFailed || result.failed;

        if (result.features && Array.isArray(result.features)) {
          allFeatures.push(...result.features);
        }
        if (result.artifacts && Array.isArray(result.artifacts)) {
          allArtifacts.push(...result.artifacts);
        }
      } catch (e) {
        console.error(`Error running test job ${i}:`, e);
        totalFails++;
        anyFailed = true;
      }
    }

    return {
      failed: anyFailed,
      fails: totalFails,
      artifacts: allArtifacts,
      features: [...new Set(allFeatures)],
      tests: testJobs.length,
      runTimeTests: totalTests,
      testJob: { name: 'CombinedResults' },
      timestamp: Date.now(),
      individualResults: allResults.map((result, idx) => ({
        index: idx,
        failed: result.failed,
        fails: result.fails,
        features: result.features || [],
        error: result.error,
        stepName: result.stepName,
        stepType: result.stepType,
        testJob: result.testJob
      })),
      summary: {
        totalTests: testJobs.length,
        passed: testJobs.length - totalFails,
        failed: totalFails,
        successRate: totalFails === 0 ? '100%' :
          ((testJobs.length - totalFails) / testJobs.length * 100).toFixed(2) + '%'
      }
    };
  }
}
