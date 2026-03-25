
import { BaseGiven } from "../../dist/module";
import type { Ibdd_in_any } from "../../src/CoreTypes";
import { BaseThen } from "../../src/verbs/bdd/BaseThen";
import { BaseWhen } from "../../src/verbs/bdd/BaseWhen";


export class MockGiven<I extends Ibdd_in_any> extends BaseGiven<I> {
  constructor(
    name: string,
    features: string[],
    whens: BaseWhen<I>[],
    thens: BaseThen<I>[],
    givenCB: I["given"],
    initialValues: any
  ) {
    super(name, features, whens, thens, givenCB, initialValues);
  }

  async givenThat(
    subject: I["isubject"],
    testResourceConfiguration: any,
    artifactory: any,
    givenCB: I["given"],
    initialValues: any
  ): Promise<I["istore"]> {
    // Call the givenCB which is a function that returns the store
    const result = (givenCB as any)();
    if (typeof result === "function") {
      return result();
    }
    return result;
  }

  uberCatcher(e: Error): void {
    console.error("MockGiven error:", e);
    (this as any).error = e;
  }
}
