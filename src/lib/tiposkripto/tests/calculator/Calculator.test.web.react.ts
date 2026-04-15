import Tiposkripto from "testeranto.tiposkripto/web";

import CalculatorUI from "./CalculatorReact.js"
import { adapter } from "./Calculator.test.web.react.adapter.js";
import { implementation } from "./Calculator.test.web.react.implementation.js";
import { specification } from "./Calculator.test.specification.js";

export default Tiposkripto(
  CalculatorUI,
  specification,
  implementation,
  adapter,
  { ports: 1000 }
);
