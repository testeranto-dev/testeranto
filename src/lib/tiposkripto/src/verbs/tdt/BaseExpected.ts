import type { TestTypeParams_any } from "../../CoreTypes.js";
import type { ITestResourceConfiguration } from "../../types.js";

/**
 * BaseExpected for TDT pattern - independent implementation
 * Validates each row in table-driven testing.
 */
export abstract class BaseExpected<I extends TestTypeParams_any> {
  name: string;
  expectedCB: (val: I["iselection"]) => Promise<I["action"]>;
  expectedValue: any = null;
  error: Error | null = null;
  status: boolean | undefined;

  constructor(
    name: string,
    expectedCB: (val: I["iselection"]) => Promise<I["action"]>,
  ) {
    this.name = name;
    this.expectedCB = expectedCB;
  }

  // Set expected value for current row
  setExpectedValue(expected: any) {
    this.expectedValue = expected;
  }

  /**
   * Abstract method to validate a row
   */
  abstract validateRow(
    store: I["istore"],
    testResourceConfiguration: any,
    filepath: string,
    expectedValue: any,
    artifactory?: any,
  ): Promise<any>;

  async test(
    store: I["istore"],
    testResourceConfiguration: ITestResourceConfiguration,
    filepath: string,
    artifactory?: any,
  ): Promise<any> {
    try {
      const result = await this.expectedCB(store as any);
      this.status = true;
      return result;
    } catch (e: any) {
      this.status = false;
      this.error = e;
      throw e;
    }
  }

  toObj() {
    return {
      name: this.name,
      status: this.status,
      error: this.error ? `${this.error.name}: ${this.error.message}` : null,
      expectedValue: this.expectedValue,
    };
  }
}

export type IExpecteds<I extends TestTypeParams_any> = Record<string, BaseExpected<I>>;

// Export the BaseExpected class as named export
export { BaseExpected };
