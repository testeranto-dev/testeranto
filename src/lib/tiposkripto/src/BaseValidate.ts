import { BaseCheck } from "./BaseCheck.js";
import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestResourceConfiguration } from "./types.js";

/**
 * BaseValidate extends BaseCheck to support TDT (Table Driven Testing) pattern.
 * It validates the output against expected results.
 */
export class BaseValidate<I extends TestTypeParams_any> extends BaseCheck<I> {
  // Expected result for the current row
  expectedResult: any = null;

  constructor(
    name: string,
    validateCB: (val: I["iselection"]) => Promise<I["then"]>
  ) {
    super(name, validateCB);
  }

  // Set expected result before validation
  setExpectedResult(expected: any) {
    this.expectedResult = expected;
  }

  // Alias verifyCheck to validate for TDT pattern
  async validate(
    store: I["istore"],
    validateCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration
  ) {
    return super.verifyCheck(store, validateCB, testResourceConfiguration);
  }

  // Alias test to check for TDT pattern
  async check(
    store: I["istore"],
    testResourceConfiguration,
    filepath: string,
    expectedResult: any
  ) {
    this.setExpectedResult(expectedResult);
    return super.test(store, testResourceConfiguration, filepath);
  }
}

export type IValidates<I extends TestTypeParams_any> = Record<string, BaseValidate<I>>;
