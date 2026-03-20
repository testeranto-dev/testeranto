import { BaseSetup } from "./BaseSetup.js";
import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestArtifactory, ITestResourceConfiguration } from "./types.js";

/**
 * BaseArrange extends BaseSetup for AAA pattern.
 */
export class BaseArrange<I extends TestTypeParams_any> extends BaseSetup<I> {
  constructor(
    features: string[],
    acts: any[],
    asserts: any[],
    arrangeCB: I["given"],
    initialValues: any
  ) {
    // Map acts to actions, asserts to checks
    super(features, acts, asserts, arrangeCB, initialValues);
  }

  // Alias setup to arrange for AAA pattern
  async arrange(
    subject: I["isubject"],
    key: string,
    testResourceConfiguration: ITestResourceConfiguration,
    tester: (t: Awaited<I["then"]> | undefined) => boolean,
    artifactory?: ITestArtifactory,
    suiteNdx?: number
  ) {
    return super.setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx);
  }
}

export type IArranges<I extends TestTypeParams_any> = Record<string, BaseArrange<I>>;
