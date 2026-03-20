import {
  TestTypeParams_any,
  TestSpecShape_any,
  ITestAdapter,
  ITestImplementation,
  ITestSpecification,
} from "./CoreTypes.js";
import BaseTiposkripto from "./BaseTiposkripto";
import { ITTestResourceRequest, defaultTestResourceRequirement } from "./types";

// TODO we can't use process in the web. 
// const config = process.argv0[2];
// we could
// 1) use query params to pass the textConfig?
// 2) pass as arugment somehow?
// 3) inject global globals?
// see hoist.ts

const config = window.testResourceConfig;


export class WebTiposkripto<
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
    const urlParams = new URLSearchParams(window.location.search);
    const encodedConfig = urlParams.get("config");
    const testResourceConfig = encodedConfig
      ? decodeURIComponent(encodedConfig)
      : "{}";

    super(
      "web",
      input,
      testSpecification,
      testImplementation,
      testResourceRequirement,
      testAdapter,
      // JSON.parse(testResourceConfig)
      config
    );
  }

  writeFileSync(
    filename: string,
    payload: string,
  ): void {
    // Call the exposed function from the hoist
    // This will throw if __writeFile is not exposed, which is what we want
    (window as any).__writeFile(filename, payload);
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
    const t = new WebTiposkripto<I, O, M>(
      input,
      testSpecification,
      testImplementation,
      testResourceRequirement,
      testAdapter
    );

    return t;

  } catch (e) {
    console.error(e);
    // Dispatch an error event
    const errorEvent = new CustomEvent("test-error", { detail: e });
    window.dispatchEvent(errorEvent);
    throw e;
  }
};

export default tiposkripto;
