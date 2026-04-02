import {
  RectangleTesterantoBaseTestImplementation,
} from "./Rectangle.test.implementation";
import {
  type O,
  RectangleTesterantoBaseTestSpecification,
} from "./Rectangle.test.specification";
import {
  RectangleTesterantoBaseAdapter,
  type I,
} from "./Rectangle.test.adapter";
import tiposkripto from "../../src/Node";

export default tiposkripto<I, O, {}>(
  null,
  RectangleTesterantoBaseTestSpecification,
  RectangleTesterantoBaseTestImplementation,
  RectangleTesterantoBaseAdapter
);
