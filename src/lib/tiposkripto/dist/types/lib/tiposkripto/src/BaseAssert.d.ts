import { BaseCheck } from "./BaseCheck.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
import type { ITestResourceConfiguration } from "./types.js";
/**
 * BaseAssert extends BaseCheck to support AAA pattern.
 * It reuses all Check functionality but with AAA naming.
 */
export declare class BaseAssert<I extends TestTypeParams_any> extends BaseCheck<I> {
    verifyCheck(store: I["istore"], checkCB: (s: I["iselection"]) => Promise<I["isubject"]>, testResourceConfiguration: ITestResourceConfiguration, artifactory?: any): Promise<I["iselection"]>;
    constructor(name: string, assertCB: (val: I["iselection"]) => Promise<I["then"]>);
    verifyAssert(store: I["istore"], assertCB: (s: I["iselection"]) => Promise<I["isubject"]>, testResourceConfiguration: ITestResourceConfiguration): Promise<I["iselection"]>;
    verify(store: I["istore"], testResourceConfiguration: any, filepath: string): Promise<I["then"] | undefined>;
}
export type IAsserts<I extends TestTypeParams_any> = Record<string, BaseAssert<I>>;
