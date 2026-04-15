import Tiposkripto from "testeranto.tiposkripto/web";

import { Calculator } from "./Calculator.js";
import { adapter } from "./Calculator.test.adapter.js";
import { implementation } from "./Calculator.test.implementation.js";
import { specification } from "./Calculator.test.specification.js";

export default Tiposkripto(
  Calculator,
  specification,
  implementation,
  adapter,
  { ports: 1000 }
);
