import { TestTypeParams_any } from "./CoreTypes.js";
import { ITestResourceConfiguration } from "./types.js";
import { BaseCheck } from "./BaseCheck.js";
/**
 * BaseThen extends BaseCheck for BDD pattern.
 * @deprecated Use BaseCheck for unified terminology
 */
export declare abstract class BaseThen<I extends TestTypeParams_any> extends BaseCheck<I> {
    thenCB: (storeState: I["iselection"]) => Promise<I["then"]>;
    constructor(name: string, thenCB: (val: I["iselection"]) => Promise<I["then"]>);
    abstract butThen(store: I["istore"], thenCB: (s: I["iselection"]) => Promise<I["isubject"]>, testResourceConfiguration: ITestResourceConfiguration): Promise<I["iselection"]>;
    test(store: I["istore"], testResourceConfiguration: any, filepath: string): Promise<I["then"] | undefined>;
}
/**
 * Represents a collection of Then assertions keyed by their names.
 * Thens are typically part of Given definitions rather than standalone collections,
 * but this type exists for consistency and potential future use cases where:
 * - Assertions might need to be reused or composed dynamically
 * - Custom assertion libraries could benefit from named assertion collections
 * - Advanced validation patterns require named Then conditions
 * @deprecated Use IChecks for unified terminology
 */
export type IThens<I extends TestTypeParams_any> = Record<string, BaseThen<I>>;
