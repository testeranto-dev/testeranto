import { TestTypeParams_any, IUniversalTestAdapter, ITestAdapter } from "./CoreTypes";
export declare const BaseAdapter: <T extends TestTypeParams_any>() => IUniversalTestAdapter<T>;
export declare const DefaultAdapter: <T extends TestTypeParams_any>(p: Partial<ITestAdapter<T>>) => IUniversalTestAdapter<T>;
