import { BaseSetup } from "./BaseSetup.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestArtifactory, ITestResourceConfiguration } from "./types.js";
/**
 * BaseMap extends BaseSetup to support TDT (Table Driven Testing) pattern.
 * It sets up the test table data.
 */
export declare class BaseMap<I extends TestTypeParams_any> extends BaseSetup<I> {
    setupThat(subject: I["isubject"], testResourceConfiguration: ITestResourceConfiguration, artifactory: ITestArtifactory, setupCB: I["given"], initialValues: any): Promise<I["istore"]>;
    tableData: any[];
    constructor(features: string[], feeds: any[], // These will be processed as actions
    validates: any[], // These will be processed as checks
    mapCB: I["given"], initialValues: any, tableData?: any[]);
    map(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["then"]> | undefined) => boolean, artifactory?: ITestArtifactory, suiteNdx?: number): Promise<I["istore"]>;
    getTableData(): any[];
}
export type IMaps<I extends TestTypeParams_any> = Record<string, BaseMap<I>>;
