
import { NodeTiposkripto } from "../../src/Node.js";
import { Calculator } from "./Calculator.js";
import { adapter } from "./Calculator.test.adapter.js";
import { implementation } from "./Calculator.test.implementation.js";
import { specification } from "./Calculator.test.specification.js";

export default new NodeTiposkripto(
  Calculator,
  specification,
  implementation,
  adapter,
  { ports: 1000 },
);
