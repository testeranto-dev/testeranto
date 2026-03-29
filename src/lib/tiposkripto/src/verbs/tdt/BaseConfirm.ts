import type { TestTypeParams_any } from "../../CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "../../types.js";
import { CommonUtils } from "../internal/CommonUtils.js";

/**
 * BaseConfirm for TDT (Table-Driven Testing) pattern.
 * Standalone class similar to BaseGiven but for table-driven testing.
 */
export class BaseConfirm<I extends TestTypeParams_any> {
  features: string[];
  testCases: any[][]; // Array of [Value, Should, Expected] tuples
  confirmCB: I["given"];
  initialValues: any;
  key: string = "";
  failed: boolean = false;
  artifacts: string[] = [];
  fails: number = 0;
  status: boolean | undefined;
  error: Error | null = null;
  store: I["istore"] = null as any;

  constructor(
    features: string[],
    testCases: any[][],
    confirmCB: I["given"],
    initialValues: any,
  ) {
    this.features = features;
    this.testCases = testCases || [];
    this.confirmCB = confirmCB;
    this.initialValues = initialValues;
  }

  addArtifact(path: string) {
    CommonUtils.addArtifact(this.artifacts, path);
  }

  setParent(parent: any) {
    (this as any)._parent = parent;
  }

  toObj() {
    const testCases = this.testCases || [];
    return CommonUtils.toObj(this, {
      testCases: testCases.map((testCase) => {
        if (Array.isArray(testCase) && testCase.length >= 2) {
          const [value, should] = testCase;
          
          // Get input data
          let inputData: any = null;
          try {
            if (typeof value === 'function') {
              inputData = value();
            } else if (value && typeof value.toObj === 'function') {
              const obj = value.toObj();
              inputData = obj.features || obj;
            } else {
              inputData = value;
            }
          } catch (e) {
            inputData = `Error: ${e.message}`;
          }
          
          // Get test description
          let testDescription: any = null;
          try {
            if (should) {
              if (typeof should === 'function') {
                // Try to get a better name from the function
                // For should functions that are created by beEqualTo(expected), etc.
                // They might have properties that indicate what they are
                if (should.name && should.name !== '') {
                  testDescription = should.name;
                } else {
                  // Try to extract from the function's string representation
                  const funcStr = should.toString();
                  if (funcStr.includes('beEqualTo')) {
                    testDescription = 'beEqualTo';
                  } else if (funcStr.includes('beGreaterThan')) {
                    testDescription = 'beGreaterThan';
                  } else if (funcStr.includes('whenMultipliedAreAtLeast')) {
                    testDescription = 'whenMultipliedAreAtLeast';
                  } else if (funcStr.includes('equal')) {
                    testDescription = 'equal';
                  } else {
                    testDescription = 'Test function';
                  }
                }
              } else if (should && typeof should.toObj === 'function') {
                const obj = should.toObj();
                testDescription = obj.name || 'Should';
              } else {
                testDescription = String(should);
              }
            }
          } catch (e) {
            testDescription = `Error: ${e.message}`;
          }
          
          return {
            input: inputData,
            test: testDescription,
          };
        }
        return testCase;
      }),
    });
  }

  async confirm(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: any,
    suiteNdx?: number,
  ) {
    this.key = key;
    this.fails = 0;
    this.testResourceConfiguration = testResourceConfiguration;

    // Store suite index for use in artifactory creation
    (this as any)._suiteIndex = suiteNdx;

    // Create a proper artifactory if one isn't provided
    const actualArtifactory = artifactory;

    // For TDT tests, we don't need to setup a store via adapter.prepareEach
    // The confirmCB is the function to test (e.g., new Calculator().add)
    this.store = null;
    this.status = true;

    try {
      // Process each test case
      for (const [caseIndex, testCase] of this.testCases.entries()) {
        try {
          // Each test case is now [Value, Should] where Should is already called with expected value
          if (Array.isArray(testCase) && testCase.length >= 2) {
            const [value, should] = testCase;

            // Get the input from value
            let input: any;
            if (typeof value === 'function') {
              input = value();
            } else if (value && typeof value.toObj === 'function') {
              const obj = value.toObj();
              input = obj.features || obj;
            } else {
              input = value;
            }
            
            // should is already a function that expects (input, fn)
            // where fn is the confirmCB (e.g., new Calculator().add)
            if (typeof should === 'function') {
              // Directly call the should function with input and this.confirmCB
              // The confirmCB is the function to test
              should(input, this.confirmCB);
              tester(true);
            }
          }
        } catch (e: any) {
          CommonUtils.handleTestError(e, this);
        }
      }
    } catch (e: any) {
      CommonUtils.handleTestError(e, this);
    }

    return this.store;
  }

  // Alias for run to match BaseSuite expectations
  async run(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory?: ITestArtifactory,
  ) {
    return this.confirm(
      subject,
      this.key || "confirm",
      testResourceConfiguration,
      (t) => !!t,
      artifactory,
    );
  }
}

export type IConfirms<I extends TestTypeParams_any> = Record<string, BaseConfirm<I>>;
