import { NodeTiposkripto } from "../../src/Node.js";
import { Circle } from "./Circle.js";
import { adapter } from "./Circle.test.adapter.js";
import { implementation } from "./Circle.test.implementation.js";
import { specification } from "./Circle.test.specification.js";

export default new NodeTiposkripto(
  Circle,
  specification,
  implementation,
  adapter,
  { ports: 1000 },
);
