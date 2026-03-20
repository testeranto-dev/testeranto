import fs from "fs"
import {
  TestTypeParams_any,
  TestSpecShape_any,
  ITestSpecification,
  ITestImplementation,
  ITestAdapter,
} from "./CoreTypes";
import BaseTiposkripto from "./BaseTiposkripto";
import { ITTestResourceRequest, defaultTestResourceRequirement } from "./types";

console.log(`[NodeTiposkripto] ${process.argv}`);

const config = JSON.parse(process.argv[2]);

export class NodeTiposkripto<
  I extends TestTypeParams_any,
  O extends TestSpecShape_any,
  M
> extends BaseTiposkripto<I, O, M> {
  constructor(
    input: I["iinput"],
    testSpecification: ITestSpecification<I, O>,
    testImplementation: ITestImplementation<I, O, M>,
    testResourceRequirement: ITTestResourceRequest,
    testAdapter: Partial<ITestAdapter<I>>
  ) {
    super(
      "node",
      input,
      testSpecification,
      testImplementation,
      testResourceRequirement,
      testAdapter,
      config
    );
  }

  writeFileSync(
    filename: string,
    payload: string,
  ) {
    fs.writeFileSync(filename, payload);
  }
}

const tiposkripto = async <I extends TestTypeParams_any, O extends TestSpecShape_any, M>(
  input: I["iinput"],
  testSpecification: ITestSpecification<I, O>,
  testImplementation: ITestImplementation<I, O, M>,
  testAdapter: Partial<ITestAdapter<I>>,
  testResourceRequirement: ITTestResourceRequest = defaultTestResourceRequirement
): Promise<BaseTiposkripto<I, O, M>> => {
  try {
    const t = new NodeTiposkripto<I, O, M>(
      input,
      testSpecification,
      testImplementation,
      testResourceRequirement,
      testAdapter
    );
    return t;
  } catch (e) {
    console.error(`[Node] Error creating Tiposkripto:`, e);
    console.error(e.stack);
    process.exit(-1);
  }
};

export default tiposkripto;
