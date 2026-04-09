import {
  FileTreeLogicTestImplementation,
} from "./FileTreeLogic.test.implementation";
import {
  type O,
  FileTreeLogicTestSpecification,
} from "./FileTreeLogic.test.specification";
import {
  FileTreeLogicTestAdapter,
  type I,
} from "./FileTreeLogic.test.adapter";
import tiposkripto from "../../../lib/tiposkripto/src/Node";

export default tiposkripto<I, O, {}>(
  null,
  FileTreeLogicTestSpecification,
  FileTreeLogicTestImplementation,
  FileTreeLogicTestAdapter
);
