import { TestTypeParams_any, TestSpecShape_any, ITestAdapter, ITestImplementation, ITestSpecification } from "./CoreTypes.js";
import BaseTiposkripto from "./BaseTiposkripto";
import { ITTestResourceRequest } from "./types";
export declare class WebTiposkripto<I extends TestTypeParams_any, O extends TestSpecShape_any, M> extends BaseTiposkripto<I, O, M> {
    constructor(input: I["iinput"], testSpecification: ITestSpecification<I, O>, testImplementation: ITestImplementation<I, O, M>, testResourceRequirement: ITTestResourceRequest, testAdapter: Partial<ITestAdapter<I>>);
    writeFileSync(filename: string, payload: string): void;
}
declare const tiposkripto: <I extends TestTypeParams_any, O extends TestSpecShape_any, M>(input: I["iinput"], testSpecification: ITestSpecification<I, O>, testImplementation: ITestImplementation<I, O, M>, testAdapter: Partial<ITestAdapter<I>>, testResourceRequirement?: ITTestResourceRequest) => Promise<BaseTiposkripto<I, O, M>>;
export default tiposkripto;
