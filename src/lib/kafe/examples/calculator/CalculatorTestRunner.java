package kafe.examples.calculator;

import kafe.*;
import java.util.*;

public class CalculatorTestRunner {
    public static void main(String[] args) {
        System.out.println("Running Calculator Tests...");
        
        // Create test implementation
        ITestImplementation testImpl = CalculatorTestImplementation.create();
        
        // Create test specification
        ITestSpecification testSpec = new CalculatorTestSpecification();
        
        // Create test adapter
        ITestAdapter<Object, Calculator, Calculator> testAdapter = new SimpleTestAdapter<>();
        
        // Create test resource configuration
        ITTestResourceConfiguration config = new ITTestResourceConfiguration(
            "calculator-test",
            "./testeranto/reports",
            new ArrayList<>(),
            null,
            30000,
            0,
            new HashMap<>()
        );
        
        // Create Kafe instance
        Kafe<Object, Calculator, Calculator, Object> kafe = new Kafe<>(
            "node",
            null,
            testSpec,
            testImpl,
            new ITTestResourceRequest(0),
            testAdapter,
            config,
            "3456",
            "localhost"
        );
        
        // Run tests
        IFinalResults results = kafe.receiveTestResourceConfig(config);
        
        System.out.println("Test Results:");
        System.out.println("  Failed: " + results.failed);
        System.out.println("  Fails: " + results.fails);
        System.out.println("  Features: " + results.features);
        System.out.println("  Tests: " + results.tests);
        System.out.println("  Runtime Tests: " + results.runTimeTests);
        
        if (results.fails > 0) {
            System.exit(1);
        } else {
            System.exit(0);
        }
    }
}
