import type { TestTypeParams_any } from "../../CoreTypes.js";
import { ITestResourceConfiguration } from "../../types.js";
/**
 * BaseValue for TDT pattern - independent implementation
 * Sets up table data for table-driven testing.
 */
export declare class BaseValue<I extends TestTypeParams_any> {
    features: string[];
    tableRows: any[][];
    confirmCB: I["setup"];
    initialValues: any;
    key: string;
    failed: boolean;
    artifacts: string[];
    fails: number;
    status: boolean | undefined;
    error: Error | null;
    store: I["istore"];
    testResourceConfiguration: ITestResourceConfiguration | null;
    constructor(features: string[], tableRows: any[][], confirmCB: I["setup"], initialValues: any);
    setParent(parent: any): void;
    addArtifact(path: string): void;
    value(subject: I["isubject"], key: string, testResourceConfiguration: ITestResourceConfiguration, tester: (t: Awaited<I["check"]> | undefined) => boolean, artifactory?: any, suiteNdx?: number): Promise<I["istore"]>;
    private processRow;
    private createArtifactoryForRow;
    afterEach(store: I["istore"], key: string, artifactory: any): Promise<I["istore"]>;
    toObj(): {
        key: string;
        values: {
            index: number;
            values: any[];
        }[];
        tableRows: any[][];
        error: (string | Error | undefined)[] | null;
        failed: boolean;
        features: string[];
        artifacts: string[];
        status: boolean | undefined;
    };
}
export type IValues<I extends TestTypeParams_any> = Record<string, BaseValue<I>>;
