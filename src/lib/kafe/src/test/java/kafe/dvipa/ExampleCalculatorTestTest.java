package kafe.dvipa;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test to verify the ExampleCalculatorTest works correctly.
 * This is a meta-test to ensure our Dvipa implementation is functional.
 */
public class ExampleCalculatorTestTest {
    
    @Test
    public void testCalculatorClass() {
        ExampleCalculatorTest.Calculator calculator = new ExampleCalculatorTest.Calculator();
        
        // Test addition
        calculator.add(2, 3);
        assertEquals(5, calculator.getResult());
        
        // Test subtraction
        calculator.subtract(10, 4);
        assertEquals(6, calculator.getResult());
        
        // Test setResult
        calculator.setResult(42);
        assertEquals(42, calculator.getResult());
    }
    
    @Test
    public void testDvipaAnnotationsPresent() {
        // Verify the annotations are present on ExampleCalculatorTest
        assertTrue(ExampleCalculatorTest.class.isAnnotationPresent(DvipaTest.class));
        
        DvipaTest dvipaTest = ExampleCalculatorTest.class.getAnnotation(DvipaTest.class);
        assertEquals("Calculator Tests", dvipaTest.value());
        assertEquals("Tests for basic calculator operations", dvipaTest.description());
    }
}
