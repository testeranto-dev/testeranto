package kafe.dvipa;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Example test using the Dvipa flavored API.
 * This demonstrates how to write BDD-style tests in Java.
 */
@DvipaTest(value = "Calculator Tests", description = "Tests for basic calculator operations")
@ExtendWith(DvipaRunner.class)
public class ExampleCalculatorTest {
    
    private Calculator calculator;
    private int lastResult;
    
    @Given("a new calculator")
    public void givenNewCalculator() {
        calculator = new Calculator();
        lastResult = 0;
    }
    
    @Given("a calculator with initial value {initial}")
    public void givenCalculatorWithInitialValue(int initial) {
        calculator = new Calculator();
        calculator.setResult(initial);
        lastResult = initial;
    }
    
    @When("adding {x} and {y}")
    public void whenAddingNumbers(int x, int y) {
        calculator.add(x, y);
        lastResult = calculator.getResult();
    }
    
    @When("subtracting {y} from {x}")
    public void whenSubtractingNumbers(int x, int y) {
        calculator.subtract(x, y);
        lastResult = calculator.getResult();
    }
    
    @Then("result should be {expected}")
    public void thenResultShouldBe(int expected) {
        assertEquals(expected, calculator.getResult(), 
            "Expected " + expected + " but got " + calculator.getResult());
    }
    
    @Then("result should be positive")
    public void thenResultShouldBePositive() {
        assertTrue(calculator.getResult() > 0, 
            "Result should be positive but was " + calculator.getResult());
    }
    
    @Test
    public void testAddition() {
        // The DvipaRunner will execute @Given methods before this test
        // Then this test method will execute the When and Then steps
        whenAddingNumbers(2, 3);
        thenResultShouldBe(5);
    }
    
    @Test
    public void testAdditionWithNegativeNumbers() {
        whenAddingNumbers(-5, 10);
        thenResultShouldBe(5);
    }
    
    @Test
    public void testSubtraction() {
        givenCalculatorWithInitialValue(10);
        whenSubtractingNumbers(10, 4);
        thenResultShouldBe(6);
    }
    
    @Test
    public void testPositiveResult() {
        givenCalculatorWithInitialValue(5);
        whenAddingNumbers(3, 2);
        thenResultShouldBePositive();
    }
    
    // Helper method to demonstrate parameter extraction from annotation values
    private Map<String, Object> extractParameters(String annotationValue, Object... args) {
        Map<String, Object> params = new HashMap<>();
        // Simple implementation - in reality would parse {x}, {y} placeholders
        if (annotationValue.contains("{x}") && args.length > 0) {
            params.put("x", args[0]);
        }
        if (annotationValue.contains("{y}") && args.length > 1) {
            params.put("y", args[1]);
        }
        if (annotationValue.contains("{expected}") && args.length > 0) {
            params.put("expected", args[0]);
        }
        if (annotationValue.contains("{initial}") && args.length > 0) {
            params.put("initial", args[0]);
        }
        return params;
    }
    
    // Simple Calculator class for demonstration
    static class Calculator {
        private int result;
        
        public Calculator() {
            this.result = 0;
        }
        
        public void add(int x, int y) {
            result = x + y;
        }
        
        public void subtract(int x, int y) {
            result = x - y;
        }
        
        public void setResult(int value) {
            result = value;
        }
        
        public int getResult() {
            return result;
        }
    }
}
