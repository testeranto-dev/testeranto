import { Ibdd_in_any } from "./CoreTypes";
export declare const BaseAdapter: <T extends TestTypeParams_any>() => IUniversalTestAdapter<T>;
export declare const DefaultAdapter: <T extends TestTypeParams_any>(p: Partial<IUniversalTestAdapter<T>>) => IUniversalTestAdapter<T>;
export { BaseSetup } from "./BaseSetup.js";
export { BaseAction } from "./BaseAction.js";
export { BaseCheck } from "./BaseCheck.js";
export { BaseArrange } from "./BaseArrange.js";
export { BaseAct } from "./BaseAct.js";
export { BaseAssert } from "./BaseAssert.js";
export { BaseMap } from "./BaseMap.js";
export { BaseFeed } from "./BaseFeed.js";
export { BaseValidate } from "./BaseValidate.js";
export { BaseGiven } from "./BaseGiven.js";
export { BaseWhen } from "./BaseWhen.js";
export { BaseThen } from "./BaseThen.js";
export declare function createAAASpecification<I extends Ibdd_in_any, O extends Ibdd_out_any>(Suite: any, Arrange: any, Act: any, Assert: any): {
    Suite: {
        Default: (name: string, arrangements: Record<string, any>) => any;
    };
    Arrange: {
        Default: (features: string[], acts: any[], asserts: any[], arrangeCB: I["given"], initialValues: any) => any;
    };
    Act: {
        Default: (name: string, actCB: (x: I["iselection"]) => I["then"]) => any;
    };
    Assert: {
        Default: (name: string, assertCB: (val: I["iselection"]) => Promise<I["then"]>) => any;
    };
};
export declare function createTDTSpecification<I extends Ibdd_in_any, O extends Ibdd_out_any>(Suite: any, Map: any, Feed: any, Validate: any): {
    Suite: {
        Default: (name: string, maps: Record<string, any>) => any;
    };
    Map: {
        Default: (features: string[], feeds: any[], validates: any[], mapCB: I["given"], initialValues: any, tableData?: any[]) => any;
    };
    Feed: {
        Default: (name: string, feedCB: (x: I["iselection"]) => I["then"]) => any;
    };
    Validate: {
        Default: (name: string, validateCB: (val: I["iselection"]) => Promise<I["then"]>) => any;
    };
};
export declare const AAA: typeof createAAASpecification;
export declare const TDT: typeof createTDTSpecification;
