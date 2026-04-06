import { ITestJob, ITestResourceConfiguration, IFinalResults } from "./types";
import { Ibdd_in_any } from "./CoreTypes";

export class TestJobCreator<I extends Ibdd_in_any> {
  constructor(
    private createArtifactory: (context: any) => any,
    private totalTests: number
  ) {}

  createTestJobForStep(step: any, index: number, input: I["iinput"]): any {
    const stepRunner = async (
      testResourceConfiguration: ITestResourceConfiguration,
    ): Promise<any> => {
      try {
        let result;
        const constructorName = step.constructor?.name || 'Unknown';

        const stepArtifactory = this.createArtifactory({
          stepIndex: index,
          stepType: constructorName.toLowerCase().replace('base', ''),
        });

        if (constructorName === 'BaseGiven') {
          result = await step.give(
            input,
            `step_${index}`,
            testResourceConfiguration,
            (t: any) => !!t,
            stepArtifactory,
            index,
          );
        } else if (constructorName === 'BaseDescribe') {
          result = await step.describe(
            input,
            `step_${index}`,
            testResourceConfiguration,
            (t: any) => !!t,
            stepArtifactory,
            index,
          );
        } else if (constructorName === 'BaseConfirm' || constructorName === 'BaseValue') {
          if (typeof step.run === 'function') {
            result = await step.run(
              input,
              testResourceConfiguration,
              stepArtifactory,
            );
          } else if (typeof step.confirm === 'function') {
            result = await step.confirm(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t: any) => !!t,
              stepArtifactory,
              index,
            );
          } else if (typeof step.value === 'function') {
            result = await step.value(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t: any) => !!t,
              stepArtifactory,
              index,
            );
          } else {
            throw new Error(`TDT step has no runnable method (run, confirm, or value)`);
          }
        } else if (constructorName === 'SpecificationError') {
          throw step.error || new Error('Test specification failed');
        } else {
          if (typeof step.run === 'function') {
            result = await step.run(
              input,
              testResourceConfiguration,
              stepArtifactory,
            );
          } else if (typeof step.test === 'function') {
            result = await step.test(
              input,
              testResourceConfiguration,
              stepArtifactory,
            );
          } else if (typeof step.give === 'function') {
            result = await step.give(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t: any) => !!t,
              stepArtifactory,
              index,
            );
          } else if (typeof step.describe === 'function') {
            result = await step.describe(
              input,
              `step_${index}`,
              testResourceConfiguration,
              (t: any) => !!t,
              stepArtifactory,
              index,
            );
          } else {
            throw new Error(`Step type ${constructorName} has no runnable method`);
          }
        }
        return { step, result, fails: step.fails || 0, failed: step.failed || false };
      } catch (e) {
        console.error((e as Error).stack);
        throw e;
      }
    };

    const runner = stepRunner;

    const totalTests = this.totalTests;
    const testJob = {
      test: step,

      toObj: () => {
        return step.toObj ? step.toObj() : {
          name: `Step_${index}`,
          type: step.constructor?.name || 'Unknown',
          key: step.key || `step_${index}`
        };
      },

      runner,

      receiveTestResourceConfig: async (
        testResourceConfiguration: ITestResourceConfiguration,
      ): Promise<IFinalResults> => {
        try {
          const stepResult = await runner(testResourceConfiguration);
          const fails = stepResult.fails;
          const stepObj = stepResult.step;

          let features: string[] = [];
          if (stepObj.features && Array.isArray(stepObj.features)) {
            features = stepObj.features;
          }

          let artifacts: any[] = [];
          if (stepObj.artifacts && Array.isArray(stepObj.artifacts)) {
            artifacts = stepObj.artifacts;
          }

          let errorDetails: any = null;
          if (stepObj.error) {
            errorDetails = {
              message: stepObj.error.message,
              stack: stepObj.error.stack,
              name: stepObj.error.name
            };
          } else if (stepResult.error) {
            errorDetails = {
              message: stepResult.error.message,
              stack: stepResult.error.stack,
              name: stepResult.error.name
            };
          }

          return {
            failed: stepResult.failed || fails > 0,
            fails,
            artifacts,
            features,
            tests: 1,
            runTimeTests: totalTests,
            testJob: testJob.toObj(),
            error: errorDetails,
            stepName: stepObj.key || stepObj.name || `Step_${index}`,
            stepType: stepObj.constructor?.name || 'Unknown'
          };
        } catch (e) {
          console.error((e as Error).stack);
          return {
            failed: true,
            fails: 1,
            artifacts: [],
            features: [],
            tests: 1,
            runTimeTests: totalTests,
            testJob: testJob.toObj(),
            error: {
              message: (e as Error).message,
              stack: (e as Error).stack,
              name: (e as Error).name
            },
            stepName: step.key || `Step_${index}`,
            stepType: step.constructor?.name || 'Error'
          };
        }
      },
    };
    return testJob;
  }

  createErrorTestJob(errorStep: any, index: number, error: Error): any {
    const totalTests = this.totalTests;
    const uniqueError = new Error(error.message);
    uniqueError.stack = error.stack;
    uniqueError.name = error.name;

    return {
      test: errorStep,

      toObj: () => {
        return errorStep.toObj();
      },

      runner: async () => {
        throw uniqueError;
      },

      receiveTestResourceConfig: async (
        testResourceConfiguration: ITestResourceConfiguration,
      ): Promise<IFinalResults> => {
        return {
          failed: true,
          fails: 1,
          artifacts: [],
          features: [],
          tests: 1,
          runTimeTests: totalTests,
          testJob: errorStep.toObj(),
          error: {
            message: uniqueError.message,
            stack: uniqueError.stack,
            name: uniqueError.name
          },
          stepName: errorStep.toObj().name || `ErrorStep_${index}`,
          stepType: 'Error'
        };
      },
    };
  }

  calculateTotalTestsDirectly(specs: any[]): number {
    return specs ? specs.length : 0;
  }
}
