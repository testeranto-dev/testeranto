import { BaseSetup } from "./BaseSetup.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "./types.js";
/**
 * BaseArrange extends BaseSetup for AAA pattern.
 */
export declare class BaseArrange<I extends TestTypeParams_any> extends BaseSetup<I> {
    setupThat(subject: I["isubject"], testResourceConfiguration: ITestResourceConfiguration, artifactory: ITestArtifactory, setupCB: I["given"], initialValues: any): Promise<I["istore"]>;
    constructor(features: string[], acts: any[], asserts: any[], arrangeCB: I["given"], initialValues: any);
    arrange(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: ITestArtifactory, suiteNdx?: number): Promise<I["istore"]>;
}
export type IArranges<I extends TestTypeParams_any> = Record<string, BaseArrange<I>>;
