import type { ITestSpecification } from "../../src/CoreTypes";
import type { ICalculatorNode, O } from "./Calculator.test.types";

export const specification: ITestSpecification<ICalculatorNode, O> = (
  Suite,
  Given,
  When,
  Then,
  Describe,
  It,
  Confirm,
  Value,
  Should,
) => {
  return [
    Suite.Default("Comprehensive Calculator Test", {
      // ========== TDT (Table-Driven Testing) Tests ==========

      tdtAdditionTable: Confirm["addition"](
        ["TDT addition table"],
        [
          [Value.of([1, 1]), Should.beEqualTo(2)],
          [Value.of([2, 3]), Should.beGreaterThan(4)],
        ],
      ),

      // ========== AAA (Describe-It) Tests ==========
      aaaBasicOperations: Describe["another simple calculator"](
        ["AAA basic operations"],
        [
          It["can save 1 memory"](),
          It["can save 2 memories"](),
        ],
      ),

      aaaDisplayTests: Describe["another simple calculator"](
        ["AAA display functionality"],
        [
          // We'll need to add more its in the implementation
          // For now, reuse existing ones
          It["can save 1 memory"](),
          It["can save 2 memories"](),
        ],
      ),

      aaaNestedDescribes: Describe["another simple calculator"](
        ["AAA nested structure"],
        [
          It["can save 1 memory"](),
          It["can save 2 memories"](),
        ],
      ),

      // ========== BDD (Given-When-Then) Tests ==========
      // Basic display tests
      bddEmptyDisplay: Given.Default(
        ["BDD empty display"],
        [],
        [Then.result("")],
      ),

      bddSingleDigit: Given.Default(
        ["BDD single digit"],
        [When.press("7")],
        [Then.result("7")],
      ),

      bddMultipleDigits: Given.Default(
        ["BDD multiple digits"],
        [When.press("1"), When.press("2"), When.press("3")],
        [Then.result("123")],
      ),

      // Arithmetic operations
      bddAddition: Given.Default(
        ["BDD addition"],
        [
          When.press("5"),
          When.press("+"),
          When.press("3"),
          When.enter(),
        ],
        [Then.result("8")],
      ),

      bddSubtraction: Given.Default(
        ["BDD subtraction"],
        [
          When.press("9"),
          When.press("-"),
          When.press("4"),
          When.enter(),
        ],
        [Then.result("5")],
      ),

      bddMultiplication: Given.Default(
        ["BDD multiplication"],
        [
          When.press("6"),
          When.press("*"),
          When.press("7"),
          When.enter(),
        ],
        [Then.result("42")],
      ),

      bddDivision: Given.Default(
        ["BDD division"],
        [
          When.press("8"),
          When.press("/"),
          When.press("2"),
          When.enter(),
        ],
        [Then.result("4")],
      ),

      // Complex expressions
      bddChainedOperations: Given.Default(
        ["BDD chained operations"],
        [
          When.press("2"),
          When.press("+"),
          When.press("3"),
          When.press("*"),
          When.press("4"),
          When.enter(),
        ],
        [Then.result("14")],
      ),

      bddDecimalOperations: Given.Default(
        ["BDD decimal operations"],
        [
          When.press("3"),
          When.press("."),
          When.press("1"),
          When.press("4"),
          When.press("+"),
          When.press("1"),
          When.press("."),
          When.press("5"),
          When.enter(),
        ],
        [Then.result("4.64")],
      ),

      // Clear functionality
      bddClearDisplay: Given.Default(
        ["BDD clear display"],
        [
          When.press("9"),
          When.press("9"),
          When.press("C"),
          When.press("5"),
        ],
        [Then.result("5")],
      ),

      // Memory operations
      bddMemoryStoreRecall: Given.Default(
        ["BDD memory store and recall"],
        [
          When.press("4"),
          When.press("2"),
          When.memoryStore(),
          When.press("C"),
          When.memoryRecall(),
        ],
        [Then.result("42")],
      ),

      bddMemoryAdd: Given.Default(
        ["BDD memory add"],
        [
          When.press("1"),
          When.press("0"),
          When.memoryStore(),
          When.press("C"),
          When.press("2"),
          When.press("0"),
          When.memoryAdd(),
          When.memoryRecall(),
        ],
        [Then.result("30")],
      ),

      bddMemoryClear: Given.Default(
        ["BDD memory clear"],
        [
          When.press("7"),
          When.press("7"),
          When.memoryStore(),
          When.memoryClear(),
          When.memoryRecall(),
        ],
        [Then.result("0")],
      ),

      // Error cases
      bddDivisionByZero: Given.Default(
        ["BDD division by zero"],
        [
          When.press("5"),
          When.press("/"),
          When.press("0"),
          When.enter(),
        ],
        [Then.result("Error")],
      ),

      bddInvalidExpression: Given.Default(
        ["BDD invalid expression"],
        [
          When.press("2"),
          When.press("+"),
          When.press("+"),
          When.press("3"),
          When.enter(),
        ],
        [Then.result("Error")],
      ),

      // Multiple whens and thens
      bddMultipleActions: Given.Default(
        ["BDD multiple actions and assertions"],
        [
          When.press("1"),
          When.press("+"),
          When.press("2"),
          When.enter(),
          When.press("*"),
          When.press("3"),
          When.enter(),
        ],
        [
          Then.result("9"),
        ],
      ),

      // Edge cases
      bddStartingWithOperator: Given.Default(
        ["BDD starting with operator"],
        [When.press("+"), When.press("5")],
        [Then.result("+5")],
      ),

      bddMultipleOperators: Given.Default(
        ["BDD multiple operators"],
        [When.press("5"), When.press("+"), When.press("-"), When.press("3")],
        [Then.result("5+-3")],
      ),

      bddLargeNumber: Given.Default(
        ["BDD large number"],
        [
          When.press("1"),
          When.press("2"),
          When.press("3"),
          When.press("4"),
          When.press("5"),
          When.press("6"),
          When.press("7"),
          When.press("8"),
          When.press("9"),
        ],
        [Then.result("123456789")],
      ),

      // Mixed operations with memory
      bddComplexMemoryScenario: Given.Default(
        ["BDD complex memory scenario"],
        [
          When.press("1"),
          When.press("0"),
          When.memoryStore(),
          When.press("C"),
          When.press("2"),
          When.press("0"),
          When.memoryAdd(),
          When.press("C"),
          When.press("5"),
          When.memoryAdd(),
          When.memoryRecall(),
          When.press("*"),
          When.press("2"),
          When.enter(),
        ],
        [Then.result("70")],
      ),

      // Parentheses operations
      bddParentheses: Given.Default(
        ["BDD parentheses"],
        [
          When.press("("),
          When.press("2"),
          When.press("+"),
          When.press("3"),
          When.press(")"),
          When.press("*"),
          When.press("4"),
          When.enter(),
        ],
        [Then.result("20")],
      ),

      // Zero handling
      bddZeroOperations: Given.Default(
        ["BDD zero operations"],
        [
          When.press("0"),
          When.press("+"),
          When.press("0"),
          When.enter(),
        ],
        [Then.result("0")],
      ),

      bddMultiplyByZero: Given.Default(
        ["BDD multiply by zero"],
        [
          When.press("5"),
          When.press("*"),
          When.press("0"),
          When.enter(),
        ],
        [Then.result("0")],
      ),
    }),
  ];
};
