import type { TestTypeParams_any } from "../../CoreTypes.js";
import type { ITestResourceConfiguration } from "../../types.js";
/**
 * BaseExpected for TDT pattern - independent implementation
 * Validates each row in table-driven testing.
 */
export declare abstract class BaseExpected<I extends TestTypeParams_any> {
    name: string;
    expectedCB: (val: I["iselection"]) => Promise<I["action"]>;
    expectedValue: any;
    error: Error | null;
    status: boolean | undefined;
    constructor(name: string, expectedCB: (val: I["iselection"]) => Promise<I["action"]>);
    setExpectedValue(expected: any): void;
    /**
     * Abstract method to validate a row
     */
    abstract validateRow(store: I["istore"], testResourceConfiguration: any, filepath: string, expectedValue: any, artifactory?: any): Promise<any>;
    test(store: I["istore"], testResourceConfiguration: ITestResourceConfiguration, filepath: string, artifactory?: any): Promise<any>;
    toObj(): {
        name: string;
        status: boolean | undefined;
        error: string | null;
        expectedValue: any;
    };
}
export type IExpecteds<I extends TestTypeParams_any> = Record<string, BaseExpected<I>>;
