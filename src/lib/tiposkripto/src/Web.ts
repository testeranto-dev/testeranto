import {
  Ibdd_in_any,
  Ibdd_out,
  Ibdd_out_any,
  ITestAdapter,
  ITestImplementation,
  ITestSpecification,
} from "./CoreTypes.js";
import BaseTiposkripto from "./BaseTiposkripto";
import { ITTestResourceRequest, defaultTestResourceRequirement } from "./types";

const config = process.argv0[2];

export class WebTiposkripto<
  I extends Ibdd_in_any,
  O extends Ibdd_out_any,
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

const tiposkripto = async <I extends Ibdd_in_any, O extends Ibdd_out, M>(
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

    // const data = navigator.storage.
    const root = await navigator.storage.getDirectory();

    // 1. Create (or get) a file handle
    const fileHandle = await root.getFileHandle(`${config.fs}/tests.json`);


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
