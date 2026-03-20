import { BaseAction } from "./BaseAction.js";
import { TestTypeParams_any } from "./CoreTypes.js";

/**
 * BaseAct extends BaseAction to support AAA pattern.
 * It reuses all Action functionality but with AAA naming.
 */
export class BaseAct<I extends TestTypeParams_any> extends BaseAction<I> {
  constructor(name: string, actCB: (xyz: I["iselection"]) => I["then"]) {
    super(name, actCB);
  }

  // Alias performAction to performAct for AAA pattern
  async performAct(
    store: I["istore"],
    actCB: (x: I["iselection"]) => I["then"],
    testResource
  ) {
    return super.performAction(store, actCB, testResource);
  }

  // Alias test to act for AAA pattern
  async act(
    store: I["istore"],
    testResourceConfiguration
  ) {
    return super.test(store, testResourceConfiguration);
  }
}

export type IActs<I extends TestTypeParams_any> = Record<string, BaseAct<I>>;
