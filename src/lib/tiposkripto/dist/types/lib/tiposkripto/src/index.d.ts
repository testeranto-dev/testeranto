import { Ibdd_in_any, ITestAdapter } from "./CoreTypes";
export declare const BaseAdapter: <T extends Ibdd_in_any>() => ITestAdapter<T>;
export declare const DefaultAdapter: <T extends Ibdd_in_any>(p: Partial<ITestAdapter<T>>) => ITestAdapter<T>;
