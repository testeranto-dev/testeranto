import type { Ibdd_in_any } from "../../src/CoreTypes.js";
import { BaseWhen } from "../../src/BaseWhen.js";

export class MockWhen<I extends Ibdd_in_any> extends BaseWhen<I> {
  constructor(name: string, whenCB: (x: I["iselection"]) => I["then"]) {
    super(name, whenCB);
  }

  async andWhen(
    store: I["istore"],
    whenCB: (x: I["iselection"]) => I["then"],
    testResource: any,
    artifactory?: any
  ): Promise<I["istore"]> {
    // The whenCB returns a function that takes the store
    const result = whenCB(store as any);
    if (typeof result === "function") {
      return result(store);
    }
    return result;
  }
}
