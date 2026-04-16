import fs from "fs";
import path from "path";
import BaseTiposkripto from "./BaseTiposkripto.js";
import {
  ITTestResourceRequest,
  defaultTestResourceRequirement,
} from "./types.js";
import {
  TestTypeParams_any,
  TestSpecShape_any,
  ITestSpecification,
  ITestImplementation,
  ITestAdapter,
} from "./CoreTypes.js";

export abstract class NodeTiposkripto<
  I extends TestTypeParams_any,
  O extends TestSpecShape_any,
  M,
> extends BaseTiposkripto<I, O, M> {
  constructor(testSpecification: ITestSpecification<I, O>) {
    // For Node runtime, we need to get config from process.argv
    let config = {};
    if (process.argv.length > 2) {
      try {
        config = JSON.parse(process.argv[2]);
      } catch (e) {
        console.error(`[NodeTiposkripto] Failed to parse config from argv:`, e);
      }
    }
    
    super(testSpecification, config);
    this.initialize();
  }

  writeFileSync(filename: string, payload: string) {
    // Ensure the directory exists before writing
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filename, payload);
  }

  // screenshot, openScreencast, and closeScreencast are not applicable to Node runtime
  // These methods are only for web runtime to capture visual artifacts in browser environments
}

export default NodeTiposkripto;
