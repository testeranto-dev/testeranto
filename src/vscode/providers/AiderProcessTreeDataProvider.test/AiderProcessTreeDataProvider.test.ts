import {
  AiderProcessTreeDataProviderTestImplementation,
} from "./AiderProcessTreeDataProvider.test.implementation";
import {
  type O,
  AiderProcessTreeDataProviderTestSpecification,
} from "./AiderProcessTreeDataProvider.test.specification";
import {
  AiderProcessTreeDataProviderTestAdapter,
  type I,
} from "./AiderProcessTreeDataProvider.test.adapter";
import tiposkripto from "../../../lib/tiposkripto/src/Node";

export default tiposkripto<I, O, {}>(
  null,
  AiderProcessTreeDataProviderTestSpecification,
  AiderProcessTreeDataProviderTestImplementation,
  AiderProcessTreeDataProviderTestAdapter
);
