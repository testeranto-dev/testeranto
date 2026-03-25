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
      values: testCases.map((testCase) => {
        if (Array.isArray(testCase) && testCase.length >= 3) {
          return {
            value: testCase[0],
            should: testCase[1],
            expected: testCase[2]
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

    try {
      // Setup phase
      this.store = await this.confirmCB(subject, this.initialValues);
      this.status = true;
    } catch (e: any) {
      this.status = false;
      CommonUtils.handleTestError(e, this);
      return this.store;
    }

    try {
      // Process each test case
      for (const [caseIndex, testCase] of this.testCases.entries()) {
        try {
          // Each test case is [Value, Should, Expected]
          if (Array.isArray(testCase) && testCase.length >= 3) {
            const [value, should, expected] = testCase;

            // Process the test case
            // In a real implementation, this would execute the test
            // For now, we'll just mark it as processed
            console.log(`[BaseConfirm] Processing test case ${caseIndex}:`, { value, should, expected });

            // Simulate test execution
            // This is where the actual test logic would go
            const result = true; // Placeholder

            if (result !== undefined) {
              tester(result);
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
