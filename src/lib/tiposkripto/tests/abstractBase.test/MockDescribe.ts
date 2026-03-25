
import type { Ibdd_in_any } from "../../src/CoreTypes.js";
import { BaseDescribe } from "../../src/index.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "../../src/types.js";

export class MockDescribe<I extends Ibdd_in_any> extends BaseDescribe<I> {
  constructor(
    features: string[],
    its: any[],
    describeCB: I["given"],
    initialValues: any
  ) {
    super(features, its, describeCB, initialValues);
  }

  async setupThat(
    subject: I["isubject"],
    testResourceConfiguration: ITestResourceConfiguration,
    artifactory: ITestArtifactory,
    setupCB: I["given"],
    initialValues: any,
  ): Promise<I["istore"]> {
    // Call the describeCB which should return the store
    const result = (setupCB as any)();
    if (typeof result === "function") {
      return result();
    }
    return result;
  }
}
