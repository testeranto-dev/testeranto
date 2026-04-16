import { BaseGiven, BaseWhen, BaseThen, BaseDescribe, BaseIt, BaseConfirm, BaseValue, BaseShould, BaseExpected } from "./verbs";
import { ITestAdapter } from "./CoreTypes";
import { Ibdd_in_any } from "./CoreTypes";

export class ClassyImplementations<I extends Ibdd_in_any> {
  static createClassyGivens<I extends Ibdd_in_any>(
    testImplementation: any,
    fullAdapter: ITestAdapter<I>,
    instance: any
  ): Record<string, any> {
    const classyGivens: Record<string, any> = {};
    if (testImplementation.givens) {
      Object.entries(testImplementation.givens).forEach(([key, g]) => {
        classyGivens[key] = (initialValues: any) => {
          return (
            whens: BaseWhen<I>[],
            thens: BaseThen<I>[],
            features: string[],
          ) => {
            const safeFeatures = Array.isArray(features) ? [...features] : [];
            const safeWhens = Array.isArray(whens) ? [...whens] : [];
            const safeThens = Array.isArray(thens) ? [...thens] : [];

            const capturedFullAdapter = fullAdapter;

            const givenInstance = new (class extends BaseGiven<I> {
              async givenThat(
                subject: any,
                testResource: any,
                artifactory: any,
                initializer: any,
                initialValues: any,
              ) {
                const givenArtifactory = instance.createArtifactory({
                  givenKey: key,
                  suiteIndex: (this as any)._suiteIndex,
                });
                return capturedFullAdapter.prepareEach(
                  subject,
                  initializer,
                  testResource,
                  initialValues,
                  givenArtifactory,
                );
              }

              afterEach(
                store: I["istore"],
                key: string,
                artifactory: any,
              ): Promise<unknown> {
                return Promise.resolve(
                  capturedFullAdapter.cleanupEach(store, key, artifactory),
                );
              }
            })(
              safeFeatures,
              safeWhens,
              safeThens,
              testImplementation.givens![key],
              initialValues,
            );

            (givenInstance as any)._parent = instance;
            if (givenInstance.setParent) {
              givenInstance.setParent(instance);
            }
            return givenInstance;
          };
        };
      });
    }
    return classyGivens;
  }

  static createClassyWhens<I extends Ibdd_in_any>(
    testImplementation: any,
    fullAdapter: ITestAdapter<I>
  ): Record<string, any> {
    const classyWhens: Record<string, any> = {};
    if (testImplementation.whens) {
      Object.entries(testImplementation.whens).forEach(
        ([key, whEn]: [string, (...x: any[]) => any]) => {
          classyWhens[key] = (...payload: any[]) => {
            const capturedFullAdapter = fullAdapter;
            const whenInstance = new (class extends BaseWhen<I> {
              async andWhen(
                store: any,
                whenCB: any,
                testResource: any,
                artifactory: any,
              ) {
                return await capturedFullAdapter.execute(
                  store,
                  whenCB,
                  testResource,
                  artifactory,
                );
              }
            })(`${key}: ${payload && payload.toString()}`, whEn(...payload));
            return whenInstance;
          };
        },
      );
    }
    return classyWhens;
  }

  static createClassyThens<I extends Ibdd_in_any>(
    testImplementation: any,
    fullAdapter: ITestAdapter<I>
  ): Record<string, any> {
    const classyThens: Record<string, any> = {};
    if (testImplementation.thens) {
      Object.entries(testImplementation.thens).forEach(
        ([key, thEn]: [string, (...x: any[]) => any]) => {
          classyThens[key] = (...args: any[]) => {
            const capturedFullAdapter = fullAdapter;
            const thenInstance = new (class extends BaseThen<I> {
              async butThen(
                store: any,
                thenCB: any,
                testResourceConfiguration: any,
                artifactory: any,
              ): Promise<I["iselection"]> {
                return capturedFullAdapter.verify(
                  store,
                  thenCB,
                  testResourceConfiguration,
                  artifactory,
                );
              }
            })(`${key}: ${args && args.toString()}`, thEn(...args));

            return thenInstance;
          };
        },
      );
    }
    return classyThens;
  }

  static createClassyConfirms<I extends Ibdd_in_any>(
    testImplementation: any
  ): Record<string, any> {
    const classyConfirms: Record<string, any> = {};
    if (testImplementation.confirms) {
      console.log('Creating confirms:', Object.keys(testImplementation.confirms));
      Object.entries(testImplementation.confirms).forEach(([key, val]) => {
        console.log(`Creating confirm for key: ${key}`);
        classyConfirms[key] = (testCases: any[][], features: string[]) => {
          console.log(`Confirm.${key} called with testCases:`, testCases);
          // Trust the type contract: val is a function that returns the confirmCB
          const actualConfirmCB = val();
          console.log(`Confirm.${key} actualConfirmCB:`, typeof actualConfirmCB);
          return new BaseConfirm<I>(
            features,
            testCases,
            actualConfirmCB,
            undefined,
          );
        };
      });
    } else {
      console.log('No confirms in testImplementation');
    }
    return classyConfirms;
  }

  static createClassyValues<I extends Ibdd_in_any>(
    testImplementation: any
  ): Record<string, any> {
    const classyValues: Record<string, any> = {};
    if (testImplementation.values) {
      Object.entries(testImplementation.values).forEach(([key, val]) => {
        // For TDT, Value.of should return input data, not create a BaseValue
        // The BaseValue is created by Confirm
        classyValues[key] = (...args: any[]) => {
          if (typeof val === 'function') {
            return val(...args);
          } else {
            return val;
          }
        };
      });
    }
    return classyValues;
  }

  static createClassyShoulds<I extends Ibdd_in_any>(
    testImplementation: any
  ): Record<string, any> {
    const classyShoulds: Record<string, any> = {};
    if (testImplementation.shoulds) {
      Object.entries(testImplementation.shoulds).forEach(
        ([key, shouldCB]: [string, (...x: any[]) => any]) => {
          // For TDT, Should.beEqualTo should return a validation function, not a BaseShould
          // The BaseShould is handled internally by Confirm
          classyShoulds[key] = (...args: any[]) => {
            return shouldCB(...args);
          };
        },
      );
    }
    return classyShoulds;
  }

  static createClassyExpecteds<I extends Ibdd_in_any>(
    testImplementation: any
  ): Record<string, any> {
    const classyExpecteds: Record<string, any> = {};
    if (testImplementation.expecteds) {
      Object.entries(testImplementation.expecteds).forEach(
        ([key, expectedCB]: [string, (...x: any[]) => any]) => {
          classyExpecteds[key] = (...args: any[]) => {
            return new BaseExpected<I>(
              `${key}: ${args && args.toString()}`,
              expectedCB(...args),
            );
          };
        },
      );
    }
    return classyExpecteds;
  }

  static createClassyDescribes<I extends Ibdd_in_any>(
    testImplementation: any
  ): Record<string, any> {
    const classyDescribes: Record<string, any> = {};
    if (testImplementation.describes) {
      Object.entries(testImplementation.describes).forEach(([key, desc]) => {
        classyDescribes[key] = (initialValues: any) => {
          return (
            its: any[],
            features: string[],
          ) => {
            // Trust the type contract: desc is a function that returns the describeCB
            const actualDescribeCB = desc(initialValues);
            return new BaseDescribe<I>(
              features,
              its,
              actualDescribeCB,
              initialValues,
            );
          };
        };
      });
    }
    return classyDescribes;
  }

  static createClassyIts<I extends Ibdd_in_any>(
    testImplementation: any
  ): Record<string, any> {
    const classyIts: Record<string, any> = {};
    if (testImplementation.its) {
      Object.entries(testImplementation.its).forEach(
        ([key, itCB]: [string, (...x: any[]) => any]) => {
          classyIts[key] = (...args: any[]) => {
            return new BaseIt<I>(
              `${key}: ${args && args.toString()}`,
              itCB(...args),
            );
          };
        },
      );
    }
    return classyIts;
  }
}
