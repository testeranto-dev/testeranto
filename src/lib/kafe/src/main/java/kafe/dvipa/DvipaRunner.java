package kafe.dvipa;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestInstancePostProcessor;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.platform.commons.support.AnnotationSupport;
import org.junit.platform.commons.support.ReflectionSupport;

import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * JUnit 5 extension for running Dvipa flavored tests.
 * This extension processes annotations and manages the BDD test lifecycle.
 */
public class DvipaRunner implements 
        TestInstancePostProcessor,
        BeforeAllCallback,
        AfterAllCallback,
        BeforeEachCallback,
        AfterEachCallback {
    
    private Map<Class<?>, TestSuiteInfo> suiteInfoCache = new ConcurrentHashMap<>();
    private ThreadLocal<TestExecution> currentExecution = new ThreadLocal<>();
    
    @Override
    public void postProcessTestInstance(Object testInstance, ExtensionContext context) throws Exception {
        Class<?> testClass = testInstance.getClass();
        if (!suiteInfoCache.containsKey(testClass)) {
            suiteInfoCache.put(testClass, analyzeTestClass(testClass));
        }
        TestSuiteInfo suiteInfo = suiteInfoCache.get(testClass);
        suiteInfo.testInstance = testInstance;
    }
    
    @Override
    public void beforeAll(ExtensionContext context) throws Exception {
        Class<?> testClass = context.getRequiredTestClass();
        TestSuiteInfo suiteInfo = suiteInfoCache.get(testClass);
        
        if (suiteInfo != null) {
            // Initialize the test suite
            Object testInstance = context.getRequiredTestInstance();
            suiteInfo.testInstance = testInstance;
            
            // Execute @Given methods marked as setup
            for (Method method : suiteInfo.givenMethods) {
                if (method.getParameterCount() == 0) {
                    method.invoke(testInstance);
                }
            }
        }
    }
    
    @Override
    public void afterAll(ExtensionContext context) throws Exception {
        // Clean up suite resources if needed
        Class<?> testClass = context.getRequiredTestClass();
        suiteInfoCache.remove(testClass);
    }
    
    @Override
    public void beforeEach(ExtensionContext context) throws Exception {
        TestExecution execution = new TestExecution();
        currentExecution.set(execution);
        
        // Get test instance
        Object testInstance = context.getRequiredTestInstance();
        execution.testInstance = testInstance;
        
        // Find the test method
        Optional<Method> testMethod = context.getTestMethod();
        if (testMethod.isPresent()) {
            execution.currentMethod = testMethod.get();
            
            // Store the test method name for reference
            execution.testMethodName = testMethod.get().getName();
            
            // Check if the test method has @Test annotation
            // We'll use this to run the BDD flow
            Optional<org.junit.jupiter.api.Test> testAnnotation = 
                AnnotationSupport.findAnnotation(testMethod.get(), org.junit.jupiter.api.Test.class);
            if (testAnnotation.isPresent()) {
                execution.isTest = true;
                
                // Find all @Given, @When, @Then methods in the test class
                Class<?> testClass = testInstance.getClass();
                execution.givenMethods = findAnnotatedMethods(testClass, Given.class);
                execution.whenMethods = findAnnotatedMethods(testClass, When.class);
                execution.thenMethods = findAnnotatedMethods(testClass, Then.class);
            }
        }
    }
    
    private List<Method> findAnnotatedMethods(Class<?> testClass, Class<? extends java.lang.annotation.Annotation> annotationClass) {
        return Arrays.stream(testClass.getDeclaredMethods())
            .filter(method -> method.isAnnotationPresent(annotationClass))
            .collect(Collectors.toList());
    }
    
    @Override
    public void afterEach(ExtensionContext context) throws Exception {
        TestExecution execution = currentExecution.get();
        if (execution != null) {
            // Clean up execution state
            execution.reset();
        }
        currentExecution.remove();
    }
    
    private TestSuiteInfo analyzeTestClass(Class<?> testClass) {
        TestSuiteInfo info = new TestSuiteInfo();
        
        // Get suite annotation
        Optional<DvipaTest> suiteAnnotation = AnnotationSupport.findAnnotation(testClass, DvipaTest.class);
        info.suiteName = suiteAnnotation.map(DvipaTest::value)
            .filter(s -> !s.isEmpty())
            .orElse(testClass.getSimpleName());
        info.description = suiteAnnotation.map(DvipaTest::description).orElse("");
        
        // Find all Given methods
        info.givenMethods = AnnotationSupport.findAnnotatedMethods(
            testClass, Given.class, ReflectionSupport.HierarchyTraversalMode.TOP_DOWN);
        
        // Find all When methods
        info.whenMethods = AnnotationSupport.findAnnotatedMethods(
            testClass, When.class, ReflectionSupport.HierarchyTraversalMode.TOP_DOWN);
        
        // Find all Then methods
        info.thenMethods = AnnotationSupport.findAnnotatedMethods(
            testClass, Then.class, ReflectionSupport.HierarchyTraversalMode.TOP_DOWN);
        
        return info;
    }
    
    // Inner classes for test management
    static class TestSuiteInfo {
        String suiteName;
        String description;
        List<Method> givenMethods;
        List<Method> whenMethods;
        List<Method> thenMethods;
        Object testInstance;
        
        void initialize(Object instance) {
            this.testInstance = instance;
        }
    }
    
    static class TestExecution {
        Method currentMethod;
        boolean isTest;
        String testMethodName;
        Object testInstance;
        Object subject;
        Object store;
        List<Method> givenMethods;
        List<Method> whenMethods;
        List<Method> thenMethods;
        Map<String, Object> context = new HashMap<>();
        
        void reset() {
            currentMethod = null;
            isTest = false;
            testMethodName = null;
            testInstance = null;
            subject = null;
            store = null;
            givenMethods = null;
            whenMethods = null;
            thenMethods = null;
            context.clear();
        }
        
        // Helper method to execute a method with proper error handling
        Object executeMethod(Method method, Object... args) throws Exception {
            method.setAccessible(true);
            try {
                return method.invoke(testInstance, args);
            } catch (Exception e) {
                Throwable cause = e.getCause();
                if (cause instanceof Exception) {
                    throw (Exception) cause;
                } else {
                    throw new RuntimeException("Failed to execute method: " + method.getName(), e);
                }
            }
        }
        
        // Run the BDD flow for a test
        void runBDDFlow() throws Exception {
            // First, execute all @Given methods to set up initial state
            for (Method givenMethod : givenMethods) {
                executeMethod(givenMethod);
            }
            
            // Execute the test method itself (which should call When/Then methods)
            if (currentMethod != null) {
                executeMethod(currentMethod);
            }
        }
    }
    
    @Override
    public void afterEach(ExtensionContext context) throws Exception {
        TestExecution execution = currentExecution.get();
        if (execution != null && execution.isTest) {
            try {
                // Run the BDD flow
                execution.runBDDFlow();
            } catch (Exception e) {
                // Mark the test as failed
                throw new RuntimeException("BDD test failed: " + e.getMessage(), e);
            }
        }
        currentExecution.remove();
    }
}
