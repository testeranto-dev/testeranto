import { TestTypeParams_any, TestSpecShape_any, ITestSpecification, ITestImplementation, ITestAdapter } from "./CoreTypes";
import BaseTiposkripto from "./BaseTiposkripto";
import { ITTestResourceRequest } from "./types";
export declare class NodeTiposkripto<I extends TestTypeParams_any, O extends TestSpecShape_any, M> extends BaseTiposkripto<I, O, M> {
    constructor(input: I["iinput"], testSpecification: ITestSpecification<I, O>, testImplementation: ITestImplementation<I, O, M>, testResourceRequirement: ITTestResourceRequest, testAdapter: Partial<ITestAdapter<I>>);
    writeFileSync(filename: string, payload: string): void;
}
declare const tiposkripto: <I extends TestTypeParams_any, O extends TestSpecShape_any, M>(input: I["iinput"], testSpecification: ITestSpecification<I, O>, testImplementation: ITestImplementation<I, O, M>, testAdapter: Partial<ITestAdapter<I>>, testResourceRequirement?: ITTestResourceRequest) => Promise<BaseTiposkripto<I, O, M>>;
export default tiposkripto;
