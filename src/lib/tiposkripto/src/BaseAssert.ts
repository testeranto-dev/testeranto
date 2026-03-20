import { BaseCheck } from "./BaseCheck.js";
import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestResourceConfiguration } from "./types.js";

/**
 * BaseAssert extends BaseCheck to support AAA pattern.
 * It reuses all Check functionality but with AAA naming.
 */
export class BaseAssert<I extends TestTypeParams_any> extends BaseCheck<I> {
  constructor(
    name: string,
    assertCB: (val: I["iselection"]) => Promise<I["then"]>
  ) {
    super(name, assertCB);
  }

  // Alias verifyCheck to verifyAssert for AAA pattern
  async verifyAssert(
    store: I["istore"],
    assertCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration
  ) {
    return super.verifyCheck(store, assertCB, testResourceConfiguration);
  }

  // Alias test to verify for AAA pattern
  async verify(
    store: I["istore"],
    testResourceConfiguration,
    filepath: string
  ) {
    return super.test(store, testResourceConfiguration, filepath);
  }
}

export type IAsserts<I extends TestTypeParams_any> = Record<string, BaseAssert<I>>;
