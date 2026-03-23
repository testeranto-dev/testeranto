import { BaseCheck } from "./BaseCheck.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestResourceConfiguration } from "./types.js";
/**
 * BaseExpected extends BaseCheck for TDT pattern.
 * Validates each row in table-driven testing.
 */
export declare abstract class BaseExpected<I extends TestTypeParams_any> extends BaseCheck<I> {
    /**
     * Abstract method to be implemented by concrete Expected classes.
     * Validates each row in table-driven testing (TDT pattern).
     *
     * @param store The test store
     * @param checkCB Check callback function
     * @param testResourceConfiguration Test resource configuration
     * @param artifactory Context-aware artifactory for file operations
     * @returns Promise resolving to the selection for verification
     */
    abstract verifyCheck(store: I["istore"], checkCB: (s: I["iselection"]) => Promise<I["isubject"]>, testResourceConfiguration: ITestResourceConfiguration, artifactory?: any): Promise<I["iselection"]>;
    expectedValue: any;
    constructor(name: string, expectedCB: (val: I["iselection"]) => Promise<I["then"]>);
    setExpectedValue(expected: any): void;
    validateRow(store: I["istore"], testResourceConfiguration: any, filepath: string, expectedValue: any, artifactory?: any): Promise<I["then"] | undefined>;
}
export type IExpecteds<I extends TestTypeParams_any> = Record<string, BaseExpected<I>>;
