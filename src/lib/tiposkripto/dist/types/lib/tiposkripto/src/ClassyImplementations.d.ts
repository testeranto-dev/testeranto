import { ITestAdapter } from "./CoreTypes";
import { Ibdd_in_any } from "./CoreTypes";
export declare class ClassyImplementations<I extends Ibdd_in_any> {
    static createClassyGivens<I extends Ibdd_in_any>(testImplementation: any, fullAdapter: ITestAdapter<I>, instance: any): Record<string, any>;
    static createClassyWhens<I extends Ibdd_in_any>(testImplementation: any, fullAdapter: ITestAdapter<I>): Record<string, any>;
    static createClassyThens<I extends Ibdd_in_any>(testImplementation: any, fullAdapter: ITestAdapter<I>): Record<string, any>;
    static createClassyConfirms<I extends Ibdd_in_any>(testImplementation: any): Record<string, any>;
    static createClassyValues<I extends Ibdd_in_any>(testImplementation: any): Record<string, any>;
    static createClassyShoulds<I extends Ibdd_in_any>(testImplementation: any): Record<string, any>;
    static createClassyExpecteds<I extends Ibdd_in_any>(testImplementation: any): Record<string, any>;
    static createClassyDescribes<I extends Ibdd_in_any>(testImplementation: any): Record<string, any>;
    static createClassyIts<I extends Ibdd_in_any>(testImplementation: any): Record<string, any>;
}
