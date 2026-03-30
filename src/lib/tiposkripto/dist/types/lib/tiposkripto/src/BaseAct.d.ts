import { BaseAction } from "./BaseAction.js";
import type { TestTypeParams_any } from "./CoreTypes.js";
/**
 * BaseAct extends BaseAction to support AAA pattern.
 * It reuses all Action functionality but with AAA naming.
 */
export declare class BaseAct<I extends TestTypeParams_any> extends BaseAction<I> {
    performAction(store: I["istore"], actionCB: (x: I["iselection"]) => I["then"], testResource: any, artifactory?: any): Promise<any>;
    constructor(name: string, actCB: (xyz: I["iselection"]) => I["then"]);
    performAct(store: I["istore"], actCB: (x: I["iselection"]) => I["then"], testResource: any): Promise<any>;
    act(store: I["istore"], testResourceConfiguration: any): Promise<any>;
}
export type IActs<I extends TestTypeParams_any> = Record<string, BaseAct<I>>;
