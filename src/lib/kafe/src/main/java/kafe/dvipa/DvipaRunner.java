package kafe.dvipa;

import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestInstancePostProcessor;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.platform.commons.support.AnnotationSupport;
import org.junit.platform.commons.support.HierarchyTraversalMode;

import java.lang.reflect.Method;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

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
                
                // Execute @Given methods before the test
                // These set up the initial state
                if (execution.givenMethods != null) {
                    for (Method givenMethod : execution.givenMethods) {
                        // Only execute methods with no parameters
                        if (givenMethod.getParameterCount() == 0) {
                            givenMethod.invoke(testInstance);
                        }
                    }
                }
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
            testClass, Given.class, HierarchyTraversalMode.TOP_DOWN);
        
        // Find all When methods
        info.whenMethods = AnnotationSupport.findAnnotatedMethods(
            testClass, When.class, HierarchyTraversalMode.TOP_DOWN);
        
        // Find all Then methods
        info.thenMethods = AnnotationSupport.findAnnotatedMethods(
            testClass, Then.class, HierarchyTraversalMode.TOP_DOWN);
        
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
        
    }
}
