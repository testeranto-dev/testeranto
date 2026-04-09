import {
  Server_GraphManagerCoreTestImplementation,
} from "./Server_GraphManagerCore.test.implementation";
import {
  type O,
  Server_GraphManagerCoreTestSpecification,
} from "./Server_GraphManagerCore.test.specification";
import {
  Server_GraphManagerCoreTestAdapter,
  type I,
} from "./Server_GraphManagerCore.test.adapter";
import tiposkripto from "../../../lib/tiposkripto/src/Node";

export default tiposkripto<I, O, {}>(
  null,
  Server_GraphManagerCoreTestSpecification,
  Server_GraphManagerCoreTestImplementation,
  Server_GraphManagerCoreTestAdapter
);
