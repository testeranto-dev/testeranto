package kafe.dvipa;

import org.junit.platform.launcher.Launcher;
import org.junit.platform.launcher.LauncherDiscoveryRequest;
import org.junit.platform.launcher.TestPlan;
import org.junit.platform.launcher.core.LauncherDiscoveryRequestBuilder;
import org.junit.platform.launcher.core.LauncherFactory;
import org.junit.platform.engine.discovery.DiscoverySelectors;

/**
 * Simple test runner for Dvipa tests.
 * This can be used to run tests programmatically.
 */
public class DvipaTestRunner {
    
    public static void runTestClass(Class<?> testClass) {
        LauncherDiscoveryRequest request = LauncherDiscoveryRequestBuilder.request()
            .selectors(DiscoverySelectors.selectClass(testClass))
            .build();
        
        Launcher launcher = LauncherFactory.create();
        TestPlan testPlan = launcher.discover(request);
        
        System.out.println("Running tests for: " + testClass.getName());
        System.out.println("Found " + testPlan.countTestIdentifiers(
            identifier -> identifier.isTest()) + " tests");
        
        launcher.execute(request);
    }
    
    public static void main(String[] args) {
        if (args.length > 0) {
            try {
                Class<?> testClass = Class.forName(args[0]);
                runTestClass(testClass);
            } catch (ClassNotFoundException e) {
                System.err.println("Test class not found: " + args[0]);
                e.printStackTrace();
            }
        } else {
            // Run the example test by default
            runTestClass(ExampleCalculatorTest.class);
        }
    }
}
