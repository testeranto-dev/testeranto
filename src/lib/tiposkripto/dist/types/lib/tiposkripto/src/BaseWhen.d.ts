import { TestTypeParams_any } from "./CoreTypes.js";
import { BaseAction } from "./BaseAction.js";
/**
 * BaseWhen extends BaseAction for BDD pattern.
 * @deprecated Use BaseAction for unified terminology
 */
export declare abstract class BaseWhen<I extends TestTypeParams_any> extends BaseAction<I> {
    whenCB: (x: I["iselection"]) => I["then"];
    constructor(name: string, whenCB: (xyz: I["iselection"]) => I["then"]);
    abstract andWhen(store: I["istore"], whenCB: (x: I["iselection"]) => I["then"], testResource: any): Promise<any>;
    performAction(store: I["istore"], actionCB: (x: I["iselection"]) => I["then"], testResource: any): Promise<any>;
    test(store: I["istore"], testResourceConfiguration: any): Promise<any>;
}
/**
 * Represents a collection of When actions keyed by their names.
 * Whens are typically part of Given definitions rather than standalone collections,
 * but this type exists for consistency and potential future use cases where:
 * - When actions might need to be reused across multiple Given conditions
 * - Dynamic composition of test steps is required
 * - Advanced test patterns need to reference When actions by name
 * @deprecated Use IActions for unified terminology
 */
export type IWhens<I extends TestTypeParams_any> = Record<string, BaseWhen<I>>;
