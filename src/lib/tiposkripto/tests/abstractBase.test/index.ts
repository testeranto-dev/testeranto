
import { NodeTiposkripto } from "../../src/Node.js";
import { testAdapter } from "./adapter.js";
import { implementation } from "./implementation.js";
import { MockGiven } from "./MockGiven.js";
import { MockThen } from "./MockThen.js";
import { MockWhen } from "./MockWhen.js";
import { specification } from "./specification.js";
import type { I, O } from "./types.js";
import { defaultTestResourceRequirement } from "../../src/types.js";

export default new NodeTiposkripto<I, O, {}>(
  {
    MockGiven,
    MockWhen,
    MockThen,
  },
  specification,
  implementation,
  defaultTestResourceRequirement,
  testAdapter
);
