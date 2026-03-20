import { BaseCheck } from "./BaseCheck.js";
import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestResourceConfiguration } from "./types.js";
/**
 * BaseValidate extends BaseCheck to support TDT (Table Driven Testing) pattern.
 * It validates the output against expected results.
 */
export declare class BaseValidate<I extends TestTypeParams_any> extends BaseCheck<I> {
    expectedResult: any;
    constructor(name: string, validateCB: (val: I["iselection"]) => Promise<I["then"]>);
    setExpectedResult(expected: any): void;
    validate(store: I["istore"], validateCB: (s: I["iselection"]) => Promise<I["isubject"]>, testResourceConfiguration: ITestResourceConfiguration): Promise<I["iselection"]>;
    check(store: I["istore"], testResourceConfiguration: any, filepath: string, expectedResult: any): Promise<I["then"] | undefined>;
}
export type IValidates<I extends TestTypeParams_any> = Record<string, BaseValidate<I>>;
