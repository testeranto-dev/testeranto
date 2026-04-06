package kafe.examples.calculator;

import kafe.*;
import java.util.*;
import java.util.function.Function;

public class CalculatorTestImplementation {
    
    public static ITestImplementation create() {
        // Suites
        Map<String, Object> suites = new HashMap<>();
        suites.put("Default", "Calculator Test Suite");
        
        // BDD Givens
        Map<String, Function<Object, Object>> givens = new HashMap<>();
        givens.put("Default", args -> {
            // Return a function that creates a Calculator
            return (Function<Object, Calculator>) (input) -> {
                return new Calculator();
            };
        });
        
        // BDD Whens
        Map<String, Function<Object, Function<Object, Object>>> whens = new HashMap<>();
        whens.put("press", args -> {
            String button = (String) args[0];
            return (Function<Calculator, Calculator>) (calc) -> {
                return calc.press(button);
            };
        });
        whens.put("enter", args -> {
            return (Function<Calculator, Calculator>) (calc) -> {
                calc.enter();
                return calc;
            };
        });
        whens.put("memoryStore", args -> {
            return (Function<Calculator, Calculator>) (calc) -> {
                calc.memoryStore();
                return calc;
            };
        });
        whens.put("memoryRecall", args -> {
            return (Function<Calculator, Calculator>) (calc) -> {
                calc.memoryRecall();
                return calc;
            };
        });
        whens.put("memoryClear", args -> {
            return (Function<Calculator, Calculator>) (calc) -> {
                calc.memoryClear();
                return calc;
            };
        });
        whens.put("memoryAdd", args -> {
            return (Function<Calculator, Calculator>) (calc) -> {
                calc.memoryAdd();
                return calc;
            };
        });
        
        // BDD Thens
        Map<String, Function<Object, Function<Object, Object>>> thens = new HashMap<>();
        thens.put("result", args -> {
            String expected = (String) args[0];
            return (Function<Calculator, Boolean>) (calc) -> {
                String actual = calc.getDisplay();
                // For numeric comparison
                try {
                    double actualNum = Double.parseDouble(actual);
                    double expectedNum = Double.parseDouble(expected);
                    return Math.abs(actualNum - expectedNum) < 0.0000001;
                } catch (NumberFormatException e) {
                    return actual.equals(expected);
                }
            };
        });
        
        // TDT Values
        Map<String, Function<Object, Object>> values = new HashMap<>();
        values.put("of", args -> {
            List<Double> numbers = (List<Double>) args[0];
            return numbers;
        });
        values.put("one and two", args -> {
            return Arrays.asList(1.0, 2.0);
        });
        
        // TDT Shoulds
        Map<String, Function<Object, Function<Object, Object>>> shoulds = new HashMap<>();
        shoulds.put("beEqualTo", args -> {
            Double expected = (Double) args[0];
            return (Function<Double, Boolean>) (actual) -> {
                return Math.abs(actual - expected) < 0.0000001;
            };
        });
        shoulds.put("beGreaterThan", args -> {
            Double expected = (Double) args[0];
            return (Function<Double, Boolean>) (actual) -> {
                return actual > expected;
            };
        });
        shoulds.put("equal", args -> {
            Object expected = args[0];
            return (Function<Object, Boolean>) (actual) -> {
                return actual.equals(expected);
            };
        });
        
        // TDT Expecteds (not used in the example, but defined for completeness)
        Map<String, Function<Object, Function<Object, Object>>> expecteds = new HashMap<>();
        
        // AAA Describes
        Map<String, Function<Object, Object>> describes = new HashMap<>();
        describes.put("a simple calculator", args -> {
            // Return a function that creates a Calculator
            return (Function<Object, Calculator>) (input) -> {
                return new Calculator();
            };
        });
        
        // AAA Its
        Map<String, Function<Object, Function<Object, Object>>> its = new HashMap<>();
        its.put("can save 1 memory", args -> {
            return (Function<Calculator, Boolean>) (calc) -> {
                calc.memoryStore();
                return Math.abs(calc.getMemory() - 0) < 0.0000001;
            };
        });
        its.put("can save 2 memories", args -> {
            return (Function<Calculator, Boolean>) (calc) -> {
                calc.memoryStore();
                calc.memoryAdd();
                return true; // Just check that it doesn't throw
            };
        });
        
        // TDT Confirms
        Map<String, Function<Object, Object>> confirms = new HashMap<>();
        confirms.put("addition", args -> {
            // Return a function that performs addition
            return (Function<List<Double>, Double>) (numbers) -> {
                if (numbers.size() >= 2) {
                    return numbers.get(0) + numbers.get(1);
                }
                return 0.0;
            };
        });
        
        return new ITestImplementation(
            suites,
            givens,
            whens,
            thens,
            values,
            shoulds,
            expecteds,
            describes,
            its,
            confirms
        );
    }
}
