import { BaseSetup } from "./BaseSetup.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "./types.js";
/**
 * BaseDescribe extends BaseSetup for Describe-It pattern (AAA).
 * Describe can be nested, and Its can mix mutations and assertions.
 */
export declare class BaseDescribe<I extends TestTypeParams_any> extends BaseSetup<I> {
    /**
     * Abstract method to be implemented by concrete Describe classes.
     * Sets up the initial state for the Describe-It pattern (AAA Arrange phase).
     *
     * @param subject The test subject
     * @param testResourceConfiguration Test resource configuration
     * @param artifactory Context-aware artifactory for file operations
     * @param setupCB Setup callback function
     * @param initialValues Initial values for setup
     * @returns Promise resolving to the test store
     */
    abstract setupThat(subject: I["isubject"], testResourceConfiguration: ITestResourceConfiguration, artifactory: ITestArtifactory, setupCB: I["given"], initialValues: any): Promise<I["istore"]>;
    its: any[];
    constructor(features: string[], its: any[], describeCB: I["given"], initialValues: any);
    setup(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: ITestArtifactory, suiteNdx?: number): Promise<I["istore"]>;
    private createArtifactoryForIt;
}
export type IDescribes<I extends TestTypeParams_any> = Record<string, BaseDescribe<I>>;
