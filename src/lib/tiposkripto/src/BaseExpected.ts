import { BaseCheck } from "./BaseCheck.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestResourceConfiguration } from "./types.js";

/**
 * BaseExpected extends BaseCheck for TDT pattern.
 * Validates each row in table-driven testing.
 */
export abstract class BaseExpected<I extends TestTypeParams_any> extends BaseCheck<I> {
  /**
   * Validates each row in table-driven testing (TDT pattern).
   * 
   * @param store The test store
   * @param checkCB Check callback function
   * @param testResourceConfiguration Test resource configuration
   * @param artifactory Context-aware artifactory for file operations
   * @returns Promise resolving to the selection for verification
   */
  async verifyCheck(
    store: I["istore"],
    checkCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory?: any,
  ): Promise<I["iselection"]> {
    // Default implementation: call checkCB and return the result
    return await checkCB(store as any);
  }

  // Expected value for current row
  expectedValue: any = null;

  constructor(
    name: string,
    expectedCB: (val: I["iselection"]) => Promise<I["then"]>,
  ) {
    super(name, expectedCB);
  }

  // Set expected value for current row
  setExpectedValue(expected: any) {
    this.expectedValue = expected;
  }

  // Validate current row
  async validateRow(
    store: I["istore"],
    testResourceConfiguration: any,
    filepath: string,
    expectedValue: any,
    artifactory?: any,
  ) {
    this.setExpectedValue(expectedValue);
    return this.test(store, testResourceConfiguration, filepath, artifactory);
  }
}

export type IExpecteds<I extends TestTypeParams_any> = Record<string, BaseExpected<I>>;
