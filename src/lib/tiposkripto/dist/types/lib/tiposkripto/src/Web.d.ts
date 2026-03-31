import BaseTiposkripto from "./BaseTiposkripto";
import { TestTypeParams_any, TestSpecShape_any, ITestSpecification, ITestImplementation, ITestAdapter } from "./CoreTypes";
import { ITTestResourceRequest } from "./types";
declare global {
    interface Window {
        testResourceConfig?: any;
        __writeFile?: (filename: string, payload: string) => void;
        __screenshot?: (filename: string, payload?: string) => void;
    }
}
export declare class WebTiposkripto<I extends TestTypeParams_any, O extends TestSpecShape_any, M> extends BaseTiposkripto<I, O, M> {
    constructor(input: I["iinput"], testSpecification: ITestSpecification<I, O>, testImplementation: ITestImplementation<I, O, M>, testResourceRequirement: ITTestResourceRequest, testAdapter: Partial<ITestAdapter<I>>);
    writeFileSync(filename: string, payload: string): void;
    screenshot(filename: string, payload?: string): void;
    openScreencast(filename: string): Promise<void>;
    closeScreencast(filename: string): Promise<void>;
    createArtifactory(context?: {
        suiteIndex?: number;
        givenKey?: string;
        whenIndex?: number;
        thenIndex?: number;
        describeIndex?: number;
        itIndex?: number;
        confirmKey?: string;
        valueKey?: string;
        shouldIndex?: number;
        expectKey?: number;
    }): {
        screenshot: (filename: string, payload?: string) => void;
        openScreencast: (filename: string) => Promise<void>;
        closeScreencast: (filename: string) => Promise<void>;
        writeFileSync: (filename: string, payload: string) => void;
    };
}
declare const tiposkripto: <I extends TestTypeParams_any, O extends TestSpecShape_any, M>(input: I["iinput"], testSpecification: ITestSpecification<I, O>, testImplementation: ITestImplementation<I, O, M>, testAdapter: Partial<ITestAdapter<I>>, testResourceRequirement?: ITTestResourceRequest) => Promise<BaseTiposkripto<I, O, M>>;
export default tiposkripto;
