import type { Ibdd_in_any } from "../../src/CoreTypes.js";
import { BaseThen } from "../../src/BaseThen.js";
import type { ITestResourceConfiguration } from "../../src/types.js";

export class MockThen<I extends Ibdd_in_any> extends BaseThen<I> {
  constructor(
    name: string,
    thenCB: (val: I["iselection"]) => Promise<I["then"]>
  ) {
    super(name, thenCB);
  }

  async butThen(
    store: I["istore"],
    thenCB: (s: I["iselection"]) => Promise<I["isubject"]>,
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory?: any
  ): Promise<I["iselection"]> {
    // The thenCB expects a selection, not the store directly
    // We need to extract the selection from the store
    const selection = { testSelection: (store as any).testSelection };
    return thenCB(selection as any);
  }
}
