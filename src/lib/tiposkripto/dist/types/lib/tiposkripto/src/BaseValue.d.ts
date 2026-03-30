import { BaseSetup } from "./BaseSetup.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "./types.js";
/**
 * BaseValue extends BaseSetup for TDT pattern.
 * Sets up table data for table-driven testing.
 */
export declare class BaseValue<I extends TestTypeParams_any> extends BaseSetup<I> {
    /**
     * Abstract method to be implemented by concrete Value classes.
     * Sets up table data for the TDT (Table-Driven Testing) pattern.
     *
     * @param subject The test subject
     * @param testResourceConfiguration Test resource configuration
     * @param artifactory Context-aware artifactory for file operations
     * @param setupCB Setup callback function
     * @param initialValues Initial values for setup
     * @returns Promise resolving to the test store
     */
    abstract setupThat(subject: I["isubject"], testResourceConfiguration: ITestResourceConfiguration, artifactory: ITestArtifactory, setupCB: I["given"], initialValues: any): Promise<I["istore"]>;
    tableRows: any[][];
    constructor(features: string[], tableRows: any[][], confirmCB: I["given"], initialValues: any);
    setup(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: ITestArtifactory, suiteNdx?: number): Promise<I["istore"]>;
    private processRow;
    private createArtifactoryForRow;
}
export type IValues<I extends TestTypeParams_any> = Record<string, BaseValue<I>>;
